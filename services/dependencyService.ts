import { FileContext, DependencyGraphData } from '../types';

export const generateDependencyGraph = (files: FileContext[]): DependencyGraphData => {
  const nodes = files.map(f => ({
    id: f.name,
    name: f.name,
    type: f.type,
    val: 1
  }));

  const links: { source: string; target: string }[] = [];
  const fileNames = new Set(files.map(f => f.name));

  files.forEach(file => {
    // Only analyze code files
    if (file.type === 'file') {
      const imports = extractImports(file.content, file.name);
      
      imports.forEach(imp => {
        // Try to find a matching file in our context
        // 1. Exact match
        // 2. Extensionless match (e.g. import './utils' -> utils.ts)
        
        const targetName = Array.from(fileNames).find(name => {
          if (name === imp) return true;
          
          // Remove extension from filename to check against import path
          const nameWithoutExt = name.split('.').slice(0, -1).join('.');
          const impBasename = imp.split('/').pop() || imp;
          
          // Exact match (helper === helper) OR path suffix match (utils/helper ends with /helper)
          // This allows matching full paths to relative imports roughly
          return nameWithoutExt === impBasename || nameWithoutExt.endsWith('/' + impBasename);
        });

        if (targetName) {
          links.push({ source: file.name, target: targetName });
        }
      });
    }
  });

  return { nodes, links };
};

const extractImports = (content: string, fileName: string): string[] => {
  const imports: string[] = [];
  
  // Basic Regex for JS/TS/React imports
  // import ... from '...'
  const jsImportRegex = /import\s+(?:[\w\s{},*]+)\s+from\s+['"]([^'"]+)['"]/g;
  // import '...'
  const sideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;
  // const ... = require('...')
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

  // Python imports
  // from ... import ...
  const pyFromRegex = /from\s+(\S+)\s+import/g;
  // import ...
  const pyImportRegex = /^import\s+(\S+)/gm;

  let match;

  if (fileName.match(/\.(ts|tsx|js|jsx)$/)) {
    while ((match = jsImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = sideEffectImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  } else if (fileName.endsWith('.py')) {
    while ((match = pyFromRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = pyImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
};