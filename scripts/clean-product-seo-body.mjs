import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const PRODUCTS_DIR = resolve(process.cwd(), "out", "products");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name === "index.html") files.push(full);
  }
  return files;
}

function removeVisibleSeoBlocks(html) {
  return html
    .replace(/<section\s+data-seo-enhancer=["']faq["'][\s\S]*?<\/section>/gi, "")
    .replace(/<nav\s+data-seo-enhancer=["']internal-links["'][\s\S]*?<\/nav>/gi, "");
}

try {
  const files = await walk(PRODUCTS_DIR);
  let changed = 0;
  for (const file of files) {
    const html = await readFile(file, "utf8");
    const cleaned = removeVisibleSeoBlocks(html);
    if (cleaned !== html) {
      await writeFile(file, cleaned, "utf8");
      changed += 1;
    }
  }
  console.log(`[SEO] Removed visible FAQ/internal-link blocks from ${changed} product page(s); JSON-LD schemas remain in <head>.`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  console.log("[SEO] No generated product directory found; nothing to clean.");
}
