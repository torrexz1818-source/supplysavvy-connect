const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn, execFileSync } = require("child_process");

const root = __dirname;
const preferredPort = 8765;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function openBrowser(url) {
  const chromeCandidates = [
    path.join(process.env.ProgramFiles || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "", "Google", "Chrome", "Application", "chrome.exe")
  ].filter(Boolean);

  try {
    const foundChrome = execFileSync("where", ["chrome"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    })
      .split(/\r?\n/)
      .find(Boolean);

    if (foundChrome) {
      chromeCandidates.unshift(foundChrome.trim());
    }
  } catch {
    // Chrome can still exist in a standard install path.
  }

  for (const candidate of chromeCandidates) {
    if (fs.existsSync(candidate)) {
      const child = spawn(candidate, [url], {
        detached: true,
        stdio: "ignore"
      });
      child.unref();
      return;
    }
  }

  spawn("cmd", ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore"
  }).unref();
}

function createServer() {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url, "http://localhost");
    const safePath = path
      .normalize(decodeURIComponent(requestUrl.pathname))
      .replace(/^(\.\.[/\\])+/, "");
    const filePath = path.join(root, safePath === "\\" || safePath === "/" ? "index.html" : safePath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";
      response.writeHead(200, { "Content-Type": contentType });
      response.end(content);
    });
  });
}

function listen(port) {
  const server = createServer();

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port === preferredPort) {
      listen(0);
      return;
    }

    console.error(error);
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}/`;
    console.log(`Clap YouTube Automation escuchando en ${url}`);
    openBrowser(url);
  });
}

listen(preferredPort);
