import * as fs from "fs";
import * as path from "path";

const buildDir = path.join(process.cwd(), ".next", "server", "app");
const outDir = path.join(process.cwd(), "out");
const staticDir = path.join(process.cwd(), ".next", "static");
const publicDir = path.join(process.cwd(), "public");
const apiBaseUrl = process.env.CAPACITOR_SERVER_URL?.trim();
const emulatorDev = process.env.CAPACITOR_EMULATOR_DEV === "true";

if (!apiBaseUrl) {
  throw new Error("CAPACITOR_SERVER_URL must be set to the HTTPS production API origin before building the mobile app.");
}

let parsedApiUrl: URL;
try {
  parsedApiUrl = new URL(apiBaseUrl);
} catch {
  throw new Error("CAPACITOR_SERVER_URL must be a valid absolute URL.");
}

const emulatorApiOrigin = "http://10.0.2.2:3000";
if (emulatorDev && parsedApiUrl.origin !== emulatorApiOrigin) {
  throw new Error(`CAPACITOR_EMULATOR_DEV may only use ${emulatorApiOrigin} as the API origin.`);
}

if (!emulatorDev && parsedApiUrl.protocol !== "https:") {
  throw new Error("CAPACITOR_SERVER_URL must use HTTPS for mobile builds.");
}

const apiHostname = parsedApiUrl.hostname.toLowerCase();
if (!emulatorDev && (
  apiHostname === "localhost" ||
  apiHostname.endsWith(".localhost") ||
  apiHostname === "127.0.0.1" ||
  apiHostname === "::1" ||
  apiHostname.endsWith(".invalid") ||
  apiHostname === "example.com" ||
  apiHostname.endsWith(".example.com")
)) {
  throw new Error("CAPACITOR_SERVER_URL must use the publisher's real production HTTPS API hostname, not a local or reserved test hostname.");
}

if (!fs.existsSync(path.join(buildDir, "app.html")) || !fs.existsSync(staticDir)) {
  throw new Error("Next.js production output is missing. Run npm run build before preparing mobile assets.");
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "app"), { recursive: true });
const nextStaticOutDir = path.join(outDir, "_next", "static");
fs.mkdirSync(nextStaticOutDir, { recursive: true });
for (const directory of ["css", "media"]) {
  const source = path.join(staticDir, directory);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(nextStaticOutDir, directory), { recursive: true });
  }
}
const chunksSource = path.join(staticDir, "chunks");
if (fs.existsSync(chunksSource)) {
  const customerRoutes = new Set(["app", "account-deletion", "privacy", "terms", "support"]);
  fs.cpSync(chunksSource, path.join(nextStaticOutDir, "chunks"), {
    recursive: true,
    filter: (source) => {
      const relativePath = path.relative(chunksSource, source).split(path.sep).join("/");
      if (!relativePath) return true;

      const sourceIsDirectory = fs.statSync(source).isDirectory();
      const segments = relativePath.split("/");
      if (segments.length === 1) {
        if (sourceIsDirectory) return relativePath === "app";
        return !relativePath.startsWith("page-");
      }

      if (segments[0] !== "app") return false;
      if (segments.length === 2) {
        if (sourceIsDirectory) return customerRoutes.has(segments[1]);
        return segments[1].startsWith("layout-");
      }
      return customerRoutes.has(segments[1]);
    },
  });
}
fs.cpSync(publicDir, outDir, { recursive: true });
const appHtml = fs.readFileSync(path.join(buildDir, "app.html"), "utf-8");
const appHtmlWithApiOrigin = appHtml.replace(
  "</head>",
  `<script>window.POTTYPLAY_API_BASE_URL = ${JSON.stringify(parsedApiUrl.origin)};${emulatorDev ? "window.POTTYPLAY_EMULATOR_DEV = true;" : ""}</script></head>`
);
fs.writeFileSync(path.join(outDir, "app", "index.html"), appHtmlWithApiOrigin, "utf-8");

for (const route of ["privacy", "terms", "support", "account-deletion"]) {
  const routeHtml = path.join(buildDir, `${route}.html`);
  if (fs.existsSync(routeHtml)) {
    const routeDir = path.join(outDir, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.copyFileSync(routeHtml, path.join(routeDir, "index.html"));
  }
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https: wss: ${emulatorDev ? emulatorApiOrigin : ""}; media-src 'self' https: blob:; img-src 'self' https: data: blob:;">
  <title>PottyPlay</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0D0F12;
      color: #F3F4F6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .loader {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(245, 158, 11, 0.2);
      border-radius: 50%;
      border-top-color: #F59E0B;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      font-size: 20px;
      margin-top: 16px;
      letter-spacing: -0.02em;
    }
    p {
      color: #9CA3AF;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="loader"></div>
  <h1>PottyPlay</h1>
  <p>Opening your cinema companion...</p>
  <script>
    window.POTTYPLAY_API_BASE_URL = ${JSON.stringify(parsedApiUrl.origin)};
    ${emulatorDev ? "window.POTTYPLAY_EMULATOR_DEV = true;" : ""}
    window.location.replace("/app/index.html");
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
console.log(`Mobile app bundle prepared in ./out with API origin ${parsedApiUrl.origin}`);
