import * as fs from "fs";
import * as path from "path";

const outDir = path.join(process.cwd(), "out");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>PottyPlay Mobile Companion</title>
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
  <h1>PottyPlay Companion</h1>
  <p>Connecting to cinema stream...</p>
  <script>
    const serverUrl = window.CAPACITOR_SERVER_URL || window.location.origin;
    if (serverUrl && serverUrl !== "file://") {
      window.location.replace(serverUrl + "/app");
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
console.log("Mobile web assets directory prepared: ./out/index.html");
