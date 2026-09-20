// 產生網站圖示與分享卡片：
//   node scripts/generate-assets.mjs
// 需要本機安裝 Chrome 或 Chromium（可用 CHROME_PATH 指定路徑）。
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error("找不到 Chrome/Chromium，請設定 CHROME_PATH 環境變數。");
  }
  return found;
}

const chrome = findChrome();
const work = mkdtempSync(path.join(tmpdir(), "math-sub-assets-"));

function screenshot(html, { width, height, out }) {
  const page = path.join(work, `${path.basename(out, ".png")}.html`);
  writeFileSync(page, html);
  execFileSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${width},${height}`,
      `--screenshot=${out}`,
      `file://${page}`,
    ],
    { stdio: "ignore" }
  );
}

/* 圖示：位值積木（千位平板 + 個/十/百小塊），與遊戲中的積木顏色一致 */
function iconSvg({ radius, scale = 1 }) {
  const blocks = `
    <g transform="translate(32 32) scale(${scale}) translate(-32 -32)" stroke="#0f172a" stroke-opacity="0.22" stroke-width="1.6">
      <rect x="17" y="15" width="30" height="12" rx="3.5" fill="#c084fc" />
      <rect x="8" y="35" width="14" height="14" rx="3.5" fill="#facc15" />
      <rect x="25" y="35" width="14" height="14" rx="3.5" fill="#4ade80" />
      <rect x="42" y="35" width="14" height="14" rx="3.5" fill="#60a5fa" />
    </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="積木王國圖示：四個不同位值的彩色積木">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#dbeafe" />
        <stop offset="1" stop-color="#fef3c7" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="${radius}" fill="url(#sky)" />
    ${blocks}
  </svg>`;
}

function iconPage(svg, size) {
  return `<!doctype html><meta charset="utf-8"><body style="margin:0;overflow:hidden;background:#e0f2fe">${svg.replace(
    `width="64" height="64"`,
    `width="${size}" height="${size}"`
  )}</body>`;
}

function buildIco(pngFiles, out) {
  const images = pngFiles.map(({ file, size }) => ({ data: readFileSync(file), size }));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const entries = Buffer.alloc(16 * images.length);
  let offset = header.length + entries.length;
  images.forEach((img, i) => {
    const e = i * 16;
    entries.writeUInt8(img.size >= 256 ? 0 : img.size, e + 0);
    entries.writeUInt8(img.size >= 256 ? 0 : img.size, e + 1);
    entries.writeUInt8(0, e + 2); // palette
    entries.writeUInt8(0, e + 3); // reserved
    entries.writeUInt16LE(1, e + 4); // color planes
    entries.writeUInt16LE(32, e + 6); // bits per pixel
    entries.writeUInt32LE(img.data.length, e + 8);
    entries.writeUInt32LE(offset, e + 12);
    offset += img.data.length;
  });
  writeFileSync(out, Buffer.concat([header, entries, ...images.map((i) => i.data)]));
}

const roundedIcon = iconSvg({ radius: 12 });
const squareIcon = iconSvg({ radius: 0 });
const maskableIcon = iconSvg({ radius: 0, scale: 0.68 });

writeFileSync(path.join(publicDir, "favicon.svg"), `${roundedIcon}\n`);

const rasterTargets = [
  { size: 16, file: "favicon-16.png", svg: squareIcon },
  { size: 32, file: "favicon-32.png", svg: squareIcon },
  { size: 48, file: "favicon-48.png", svg: squareIcon },
  { size: 180, file: "apple-touch-icon.png", svg: squareIcon },
  { size: 192, file: "icon-192.png", svg: squareIcon },
  { size: 512, file: "icon-512.png", svg: squareIcon },
  { size: 512, file: "icon-maskable-512.png", svg: maskableIcon },
];

const icoSources = [];
for (const target of rasterTargets) {
  const out = path.join(publicDir, target.file);
  screenshot(iconPage(target.svg, target.size), { width: target.size, height: target.size, out });
  console.log(`✓ ${path.relative(root, out)} (${target.size}×${target.size})`);
  if (target.size <= 48) icoSources.push({ file: out, size: target.size });
}

const icoPath = path.join(publicDir, "favicon.ico");
buildIco(icoSources, icoPath);
console.log(`✓ ${path.relative(root, icoPath)} (16/32/48)`);

const cardPath = path.join(publicDir, "social-card.png");
screenshot(readFileSync(path.join(root, "design/social-card.html"), "utf8"), {
  width: 1200,
  height: 630,
  out: cardPath,
});
console.log(`✓ ${path.relative(root, cardPath)} (1200×630)`);

rmSync(work, { recursive: true, force: true });
