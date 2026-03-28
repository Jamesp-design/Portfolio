/**
 * Writes images/gallery/manifest.json from every image file in images/gallery/
 * (skips manifest.json). Run from repo root: node scripts/update-gallery-manifest.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const galleryDir = path.join(root, "images", "gallery");
const outFile = path.join(galleryDir, "manifest.json");

const extOk = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"]);

const names = fs
  .readdirSync(galleryDir, { withFileTypes: true })
  .filter((d) => d.isFile() && d.name !== "manifest.json" && extOk.has(path.extname(d.name).toLowerCase()))
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

fs.writeFileSync(outFile, JSON.stringify({ images: names }, null, 2) + "\n", "utf8");
console.log(`Wrote ${names.length} image(s) to images/gallery/manifest.json`);
