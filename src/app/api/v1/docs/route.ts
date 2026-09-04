import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  try {
    const docsDir = path.join(process.cwd(), 'docs');

    // Quick BFS to find the file
    let targetPath = null;
    const dirsToSearch = [docsDir];

    while (dirsToSearch.length > 0 && !targetPath) {
      const currentDir = dirsToSearch.shift()!;
      if (!fs.existsSync(currentDir)) continue;

      const files = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const file of files) {
        if (file.isDirectory() && file.name !== 'project' && file.name !== 'images') {
          dirsToSearch.push(path.join(currentDir, file.name));
        } else if (file.name === `${slug}.md`) {
          targetPath = path.join(currentDir, file.name);
          break;
        } else if (slug === 'README' && file.name === 'README.md') {
            const relDir = path.basename(currentDir);
            if (searchParams.get('domain') === relDir) {
                targetPath = path.join(currentDir, file.name);
                break;
            }
        }
      }
    }

    if (slug === 'README' && !targetPath && searchParams.get('domain') === 'root') {
        targetPath = path.join(docsDir, 'README.md');
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const content = fs.readFileSync(targetPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
