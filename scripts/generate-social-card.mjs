import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

// Generate a real 1200×630 OG image before Next.js copies /public into /out.
// Share previews must not use the original long, narrow company logo directly:
// Messenger/Facebook crop it to fit the card and make its text unreadable.
const ROOT = resolve(process.cwd());
const LOGO = resolve(ROOT, "public/higiqlogo.png");
const DESTINATION = resolve(ROOT, "public/social-card-2026.png");

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f3f8f9"/>
  <rect x="0" y="0" width="1200" height="14" fill="#18b99f"/>
  <circle cx="1135" cy="550" r="260" fill="#d5f4ee"/>
  <circle cx="48" cy="94" r="115" fill="#e0f6f1"/>
  <rect x="66" y="61" width="1068" height="508" rx="34" fill="#ffffff" stroke="#e3eeee" stroke-width="2"/>
  <rect x="390" y="514" width="420" height="8" rx="4" fill="#18b99f"/>
  <text x="600" y="455" fill="#163442" font-family="DejaVu Sans, sans-serif" font-size="31" font-weight="600" text-anchor="middle">SANO • ПЕРИЛНИ И ПОЧИСТВАЩИ ПРЕПАРАТИ</text>
</svg>`);

const logo = await sharp(LOGO)
  .rotate()
  .flatten({ background: "#ffffff" })
  .resize(890, 280, { fit: "contain", background: "#ffffff" })
  .png()
  .toBuffer();

const image = await sharp(background)
  .composite([{ input: logo, top: 129, left: 155 }])
  .png({ compressionLevel: 9 })
  .toBuffer();

const dimensions = await sharp(image).metadata();
if (dimensions.width !== 1200 || dimensions.height !== 630)
  throw new Error("Invalid social card dimensions.");

await mkdir(resolve(ROOT, "public"), { recursive: true });
await writeFile(DESTINATION, image);
console.log(`[social] Generated 1200×630 PNG share card (${image.length} bytes).`);
