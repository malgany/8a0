import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://8a0.com.br";
const ROOT = process.cwd();

const pages = [
  { name: "home-en", url: `${ORIGIN}/en` },
  { name: "play-en", url: `${ORIGIN}/en/play` },
  { name: "privacy-en", url: `${ORIGIN}/en/privacidade` },
];

async function ensureDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status}`);
  }
  return response.text();
}

async function fetchFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status}`);
  }
  await ensureDir(destination);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, buffer);
}

function absoluteUrl(url) {
  if (url.startsWith("http")) return url;
  return `${ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

function localVendorPath(url) {
  const parsed = new URL(absoluteUrl(url));
  const cleanPath = parsed.pathname
    .replace(/^\/_next\/static\//, "")
    .replace(/^\/+/, "");
  return path.join(ROOT, "public", "vendor", "8a0", cleanPath);
}

function extractAssets(html) {
  const urls = new Set();
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (
      url.startsWith("/_next/static/css/") ||
      url.startsWith("/_next/static/media/") ||
      url === "/favicon.ico" ||
      url.startsWith("/icon.svg")
    ) {
      urls.add(url);
    }
  }
  return [...urls];
}

function extractPlayChunk(html) {
  const match = html.match(/static\/chunks\/app\/%5Blocale%5D\/play\/[^" ]+\.js/);
  if (!match) throw new Error("Could not find play chunk");
  return `/_next/${match[0]}`;
}

function extractSquadIndex(playChunk) {
  const marker = "let c=JSON.parse('";
  const start = playChunk.indexOf(marker);
  if (start < 0) throw new Error("Could not find squad index marker");
  const jsonStart = start + marker.length;
  const jsonEnd = playChunk.indexOf("]')", jsonStart);
  if (jsonEnd < 0) throw new Error("Could not find squad index end");
  const raw = `${playChunk.slice(jsonStart, jsonEnd)}]`;
  return JSON.parse(raw);
}

async function main() {
  const snapshotDir = path.join(ROOT, "public", "vendor", "8a0", "snapshots");
  await mkdir(snapshotDir, { recursive: true });

  const htmlByName = {};
  for (const page of pages) {
    const html = await fetchText(page.url);
    htmlByName[page.name] = html;
    await writeFile(path.join(snapshotDir, `${page.name}.html`), html);
  }

  const assetUrls = new Set();
  for (const html of Object.values(htmlByName)) {
    extractAssets(html).forEach((asset) => assetUrls.add(asset));
  }

  for (const asset of assetUrls) {
    const destination = localVendorPath(asset.split("?")[0]);
    await fetchFile(absoluteUrl(asset), destination);
  }

  const cssAssets = [...assetUrls].filter((asset) =>
    asset.startsWith("/_next/static/css/"),
  );
  for (const cssAsset of cssAssets) {
    const cssPath = localVendorPath(cssAsset);
    const css = await readFile(cssPath, "utf8");
    for (const match of css.matchAll(/url\((\/_next\/static\/media\/[^)]+)\)/g)) {
      assetUrls.add(match[1].replace(/['"]/g, ""));
    }
  }

  for (const asset of assetUrls) {
    const destination = localVendorPath(asset.split("?")[0]);
    try {
      await fetchFile(absoluteUrl(asset), destination);
    } catch (error) {
      if (!String(error).includes("Failed")) throw error;
    }
  }

  let originalCss = "";
  for (const cssAsset of cssAssets.sort()) {
    const cssPath = localVendorPath(cssAsset);
    const css = await readFile(cssPath, "utf8");
    originalCss += `\n/* ${cssAsset} */\n${css.replaceAll("/_next/static/media/", "/vendor/8a0/media/")}\n`;
  }
  await mkdir(path.join(ROOT, "src", "app"), { recursive: true });
  await writeFile(path.join(ROOT, "src", "app", "original.css"), originalCss);

  const playChunkUrl = extractPlayChunk(htmlByName["play-en"]);
  const playChunkPath = localVendorPath(playChunkUrl);
  await fetchFile(absoluteUrl(playChunkUrl), playChunkPath);

  const playChunk = await readFile(playChunkPath, "utf8");
  const squadIndex = extractSquadIndex(playChunk);
  await mkdir(path.join(ROOT, "src", "data"), { recursive: true });
  await writeFile(
    path.join(ROOT, "src", "data", "squad-index.json"),
    JSON.stringify(squadIndex, null, 2),
  );
  await writeFile(
    path.join(ROOT, "src", "data", "squad-index.ts"),
    `import raw from "./squad-index.json";\n\nexport const squadIndex = raw as Array<{ sel: string; copa: number; slug: string }>;\n`,
  );

  const squadsDir = path.join(ROOT, "public", "squads");
  await mkdir(squadsDir, { recursive: true });
  const squadFiles = [];
  for (const squad of squadIndex) {
    const squadPath = path.join(squadsDir, `${squad.slug}.json`);
    await fetchFile(`${ORIGIN}/squads/${squad.slug}.json`, squadPath);
    squadFiles.push(JSON.parse(await readFile(squadPath, "utf8")));
  }
  await writeFile(path.join(ROOT, "src", "data", "squads.json"), `${JSON.stringify(squadFiles)}\n`);

  await writeFile(
    path.join(ROOT, "public", "vendor", "8a0", "manifest.json"),
    JSON.stringify(
      {
        origin: ORIGIN,
        syncedAt: new Date().toISOString(),
        pages: pages.map((page) => page.url),
        assets: [...assetUrls],
        squads: squadIndex.length,
        playChunk: playChunkUrl,
      },
      null,
      2,
    ),
  );

  console.log(`Synced ${assetUrls.size} assets and ${squadIndex.length} squads.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
