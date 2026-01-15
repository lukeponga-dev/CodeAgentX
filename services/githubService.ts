import { FileContext } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export function parseGithubUrl(url: string) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');
  return { owner, repo };
}

export async function fetchGithubRepo(url: string, token?: string): Promise<FileContext[]> {
  const parsed = parseGithubUrl(url);
  if (!parsed) throw new Error("Invalid GitHub URL. Format: https://github.com/owner/repo");
  const { owner, repo } = parsed;

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // 1. Get Default Branch
  const repoDataRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers });
  if (!repoDataRes.ok) {
    if (repoDataRes.status === 403) throw new Error("GitHub API rate limit exceeded or unauthorized.");
    if (repoDataRes.status === 404) throw new Error("Repository not found or private.");
    throw new Error("Failed to fetch repository details.");
  }
  const repoData = await repoDataRes.json();
  const branch = repoData.default_branch;

  // 2. Get File Tree (Recursive)
  const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
  if (!treeRes.ok) throw new Error("Failed to fetch file tree.");
  const treeData = await treeRes.json();

  const allBlobs = treeData.tree.filter((node: any) => node.type === 'blob');
  const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.md', '.go', '.rs', '.java', '.c', '.cpp', '.h'];

  const priorityFiles = allBlobs.filter((node: any) => {
    const path = node.path.toLowerCase();
    if (path.endsWith('readme.md') || path.endsWith('package.json')) return true;
    return relevantExtensions.some(ext => path.endsWith(ext));
  }).slice(0, 15); // Increased to 15 for better context

  // 3. Fetch File Content
  const fetchedFiles: FileContext[] = await Promise.all(priorityFiles.map(async (node: any) => {
    const contentRes = await fetch(node.url, { headers });
    if (!contentRes.ok) return null;
    const contentData = await contentRes.json();

    try {
      const binaryString = atob(contentData.content.replace(/\s/g, ''));
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder('utf-8');
      const textContent = decoder.decode(bytes);

      let type: FileContext['type'] = 'file';
      const lowerName = node.path.toLowerCase();
      if (lowerName.endsWith('.json') || lowerName.endsWith('.csv')) type = 'metric';

      return {
        id: node.sha,
        name: node.path,
        content: textContent,
        type: type,
        mimeType: 'text/plain'
      };
    } catch (e) {
      return null;
    }
  }));

  return fetchedFiles.filter((f): f is FileContext => f !== null);
}

export async function commitToGithub(
  url: string,
  token: string,
  message: string,
  files: { path: string, content: string }[],
  branchName?: string
): Promise<string> {
  const parsed = parseGithubUrl(url);
  if (!parsed) throw new Error("Invalid GitHub URL");
  const { owner, repo } = parsed;

  const headers: HeadersInit = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  // 1. Get branch info to find the latest commit SHA and its tree SHA
  const branch = branchName || (await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers }).then(r => r.json())).default_branch;
  const branchRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches/${branch}`, { headers });
  if (!branchRes.ok) throw new Error("Failed to fetch branch info");
  const branchData = await branchRes.json();
  const lastCommitSha = branchData.commit.sha;

  // 2. Create Blobs for each file
  const treeItems = await Promise.all(files.map(async (file) => {
    const blobRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: file.content,
        encoding: 'utf-8'
      })
    });
    if (!blobRes.ok) throw new Error(`Failed to create blob for ${file.path}`);
    const blobData = await blobRes.json();
    return {
      path: file.path,
      mode: '100644', // normal file
      type: 'blob',
      sha: blobData.sha
    };
  }));

  // 3. Create a new Tree
  const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: branchData.commit.commit.tree.sha,
      tree: treeItems
    })
  });
  if (!treeRes.ok) throw new Error("Failed to create tree");
  const treeData = await treeRes.json();

  // 4. Create a Commit
  const commitRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [lastCommitSha]
    })
  });
  if (!commitRes.ok) throw new Error("Failed to create commit");
  const commitData = await commitRes.json();

  // 5. Update Reference
  const refRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: commitData.sha,
      force: false
    })
  });
  if (!refRes.ok) throw new Error("Failed to update reference");

  return commitData.html_url;
}
