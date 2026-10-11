import fs from "node:fs/promises";
import path from "node:path";

const manifestPath = "scripts/library-sources.json";
const outputRoot = "website/library/imported";
const allowedLicenses = new Set(["CC0-1.0","CC-BY-4.0","CC-BY-SA-4.0"]);
const allowedExtensions = new Set([".txt",".md",".svg",".png",".jpg",".jpeg",".webp",".vtt",".srt"]);
const maxBytes = 5 * 1024 * 1024;
const manifest = JSON.parse(await fs.readFile(manifestPath,"utf8"));
if (!Array.isArray(manifest.sources)) throw new Error("manifest.sources must be an array");
const report = [];
for (const source of manifest.sources) {
  const id = String(source.id || "").toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,50}$/.test(id)) throw new Error("Invalid source id: " + id);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository || "")) throw new Error("Invalid repository for " + id);
  if (!allowedLicenses.has(source.license)) throw new Error("License not allowlisted for " + id + ": " + source.license);
  if (source.licenseVerified !== true || !/^https:\/\//.test(source.licenseUrl || "")) throw new Error("Explicit rights review and license URL required for " + id);
  if (!/^https:\/\/github\.com\//.test(source.sourceUrl || "")) throw new Error("Canonical GitHub source URL required for " + id);
  const ext = path.extname(source.path || "").toLowerCase();
  if (!allowedExtensions.has(ext)) throw new Error("File extension not allowed for " + id + ": " + ext);
  if (source.path.includes("..") || source.path.startsWith("/")) throw new Error("Unsafe source path for " + id);
  const ref = encodeURIComponent(source.ref || "main");
  const url = "https://raw.githubusercontent.com/" + source.repository + "/" + ref + "/" + source.path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(url, {headers:{"User-Agent":"NARATIVA-Library-Importer"}});
  if (!response.ok) throw new Error("Fetch failed (" + response.status + "): " + source.repository + "/" + source.path);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > maxBytes) throw new Error("Asset empty or exceeds 5 MB: " + id);
  if (ext === ".txt" || ext === ".md" || ext === ".svg" || ext === ".vtt" || ext === ".srt") {
    const text = bytes.toString("utf8");
    if (text.includes("\u0000")) throw new Error("Unexpected binary content in text asset: " + id);
    if (ext === ".svg" && /<script|onload\s*=|javascript:/i.test(text)) throw new Error("Potentially unsafe SVG rejected: " + id);
  }
  const target = path.join(outputRoot, id + ext);
  await fs.mkdir(path.dirname(target), {recursive:true});
  await fs.writeFile(target, bytes);
  const metadata = {
    id, title:source.title, author:source.author || "Tidak dicantumkan",
    repository:source.repository, sourceUrl:source.sourceUrl, sourcePath:source.path,
    license:source.license, licenseUrl:source.licenseUrl,
    attribution:source.attribution || source.author || source.title,
    importedAt:new Date().toISOString(), file:target, bytes:bytes.length,
    contentType:source.contentType || ext.slice(1)
  };
  await fs.writeFile(target + ".meta.json", JSON.stringify(metadata,null,2) + "\n");
  report.push(metadata);
}
await fs.mkdir("website/library",{recursive:true});
await fs.writeFile("website/library/import-report.json", JSON.stringify({generatedAt:new Date().toISOString(),allowedLicenses:[...allowedLicenses],imported:report},null,2)+"\n");
console.log("NARATIVA library import complete:", report.length, "asset(s)");
for (const item of report) console.log("-", item.title, "=>", item.file, "(", item.license, ")");
