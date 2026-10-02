import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/resume.html", ["resume.html", "text/html; charset=utf-8"]],
  [
    "/static/assets/css/theme.css",
    ["static/assets/css/theme.css", "text/css; charset=utf-8"],
  ],
  [
    "/static/assets/js/theme.js",
    ["static/assets/js/theme.js", "text/javascript; charset=utf-8"],
  ],
  [
    "/static/assets/css/portfolio.css",
    ["static/assets/css/portfolio.css", "text/css; charset=utf-8"],
  ],
  [
    "/static/assets/css/resume.css",
    ["static/assets/css/resume.css", "text/css; charset=utf-8"],
  ],
  [
    "/static/assets/js/portfolio.js",
    ["static/assets/js/portfolio.js", "text/javascript; charset=utf-8"],
  ],
  [
    "/static/assets/img/monogram.svg",
    ["static/assets/img/monogram.svg", "image/svg+xml"],
  ],
  [
    "/static/assets/img/profile-img.jpg",
    ["static/assets/img/profile-img.jpg", "image/jpeg"],
  ],
]);

// Explicitly allow public assets only; never expose .git, environments, or source files.
export function createPreviewServer() {
  return createServer(async (request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const pathname = new URL(request.url, "http://localhost").pathname;
    const asset = assets.get(pathname);
    if (!asset) {
      response
        .writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
        .end("Not found");
      return;
    }
    try {
      const content = await readFile(resolve(root, asset[0]));
      response.writeHead(200, {
        "Content-Type": asset[1],
        "Content-Length": content.length,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch {
      response
        .writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
        .end("Unable to read public asset");
    }
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.argv[2] || 4173);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Use a port between 1024 and 65535");
  const server = createPreviewServer();
  server.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(`Portfolio preview: http://127.0.0.1:${port}`),
  );
}
