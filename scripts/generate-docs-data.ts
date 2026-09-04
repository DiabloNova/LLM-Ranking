import fs from "fs";
import path from "path";

export interface DocMeta {
  slug: string;
  title: string;
  category: string;
  path: string;
  contentSnippet: string;
}

const CATEGORY_MAP: Record<string, string> = {
  "product": "Product",
  "user-guides": "User Guides",
  "services": "Services",
  "api": "API",
  "architecture": "Architecture",
  "security": "Security",
  "project": "Project",
  "features": "Features",
  "database": "Database"
};

function getAllDocs(basePath = "docs"): DocMeta[] {
  const fullPath = path.join(process.cwd(), basePath);
  let docs: DocMeta[] = [];

  if (!fs.existsSync(fullPath)) {
    return docs;
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const res = path.resolve(fullPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "project" && entry.name !== "images") {
        docs = docs.concat(getAllDocs(path.join(basePath, entry.name)));
      }
    } else {
      if (entry.name.endsWith(".md")) {
        const relPath = path.relative(path.join(process.cwd(), "docs"), fullPath);
        const categoryParts = relPath.split(path.sep);
        const category = categoryParts[0] || "product";

        let slug = entry.name.replace(/\.md$/, "");

        // Handle README.md inside domain roots
        if (slug === "README") {
            slug = category; // E.g., 'product', 'user-guides'
        }

        let title = slug.replace(/-/g, " ");
        title = title.charAt(0).toUpperCase() + title.slice(1);
        let contentSnippet = "";

        try {
            const content = fs.readFileSync(res, "utf-8");
            const firstLine = content.split('\n').find(line => line.startsWith('# '));
            if (firstLine) {
                title = firstLine.replace('# ', '').trim();
            }
            contentSnippet = content.substring(0, 500).replace(/\n/g, ' ');
        } catch (e) {}

        docs.push({
          slug,
          title,
          category,
          path: path.join(basePath, entry.name),
          contentSnippet
        });
      }
    }
  }

  return docs;
}

function generate() {
  const docs = getAllDocs("docs");

  let indexOutput = `// Auto-generated metadata index for navigation and search
export interface DocMeta {
  slug: string;
  titleEn: string;
  titleFa: string;
  category: string;
  categoryFa?: string;
  snippet: string;
}

export const DOCS_INDEX: DocMeta[] = [\n`;

  for (const doc of docs) {
    const title = doc.title.replace(/"/g, '\\"');
    const snippet = doc.contentSnippet.replace(/"/g, '\\"').replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    indexOutput += `  {
    slug: "${doc.slug}",
    titleEn: "${title}",
    titleFa: "${title}",
    category: "${doc.category}",
    categoryFa: "${CATEGORY_MAP[doc.category] || doc.category}",
    snippet: \`${snippet}\`
  },\n`;
  }
  indexOutput += `];\n`;
  fs.writeFileSync(path.join(process.cwd(), "src/lib/docsIndex.ts"), indexOutput);

  console.log("Generated docs index metadata with content snippets.");
}

generate();
