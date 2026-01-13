import { FileContext } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export async function fetchGithubRepo(url: string): Promise<FileContext[]> {
  // 1. Parse URL to get owner and repo
  // Supports: https://github.com/owner/repo
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error("Invalid GitHub URL. Format: https://github.com/owner/repo");
  const [, owner, repoName] = match;
  // Remove .git if present
  const repo = repoName.replace(/\.git$/, '');

  // 2. Get Default Branch (to ensure we pull from main/master/dev correctly)
  const repoDataRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`);
  if (!repoDataRes.ok) {
    if (repoDataRes.status === 403) throw new Error("GitHub API rate limit exceeded. Try again later.");
    if (repoDataRes.status === 404) throw new Error("Repository not found or private.");
    throw new Error("Failed to fetch repository details.");
  }
  const repoData = await repoDataRes.json();
  const branch = repoData.default_branch;

  // 3. Get File Tree (Recursive)
  const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  if (!treeRes.ok) throw new Error("Failed to fetch file tree.");
  const treeData = await treeRes.json();

  if (treeData.truncated) {
    console.warn("Repo is too large, tree truncated.");
  }

  // 4. Filter Files
  // To avoid hitting rate limits and overwhelming the context window, we select a subset of relevant files.
  // Priority: README, package.json, source files (.ts, .js, .py, .tsx, .jsx, .go, .rs, .java)
  const allBlobs = treeData.tree.filter((node: any) => node.type === 'blob');
  
  const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.md', '.go', '.rs', '.java', '.c', '.cpp', '.h'];
  
  const priorityFiles = allBlobs.filter((node: any) => {
    const path = node.path.toLowerCase();
    // Always include README and package.json
    if (path.endsWith('readme.md') || path.endsWith('package.json')) return true;
    
    // Check extensions
    return relevantExtensions.some(ext => path.endsWith(ext));
  }).slice(0, 10); // HARD LIMIT: 10 files for demo stability

  if (priorityFiles.length === 0) throw new Error("No relevant code files found in repository.");

  // 5. Fetch File Content
  // We use the blob URL provided in the tree to get base64 content
  const fetchedFiles: FileContext[] = await Promise.all(priorityFiles.map(async (node: any) => {
    const contentRes = await fetch(node.url);
    if (!contentRes.ok) return null;
    const contentData = await contentRes.json();
    
    // GitHub API returns content in base64
    // We need to decode it to UTF-8 text
    // Note: large files might fail here, but we filtered for source code which is usually manageable
    try {
        // decoding base64 properly handling utf8
        const binaryString = atob(contentData.content.replace(/\s/g, ''));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const decoder = new TextDecoder('utf-8');
        const textContent = decoder.decode(bytes);

        let type: FileContext['type'] = 'file';
        const lowerName = node.path.toLowerCase();
        
        if (lowerName.endsWith('.json') || lowerName.endsWith('.csv')) {
            type = 'metric'; // Heuristic
        }

        return {
            id: node.sha,
            name: node.path,
            content: textContent,
            type: type,
            mimeType: 'text/plain'
        };
    } catch (e) {
        console.warn(`Failed to decode ${node.path}`, e);
        return null;
    }
  }));

  return fetchedFiles.filter((f): f is FileContext => f !== null);
}