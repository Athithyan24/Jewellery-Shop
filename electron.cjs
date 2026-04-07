const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");
const fs = require("fs");

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, 
    title: "Jewellery Shop Manager",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(
    path.join(__dirname, "jwelleryshop", "dist", "index.html")
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus(); 
  });
}

app.whenReady().then(() => {
  const userDataPath = app.getPath("userData");
  console.log("Your device storage folder is at:", userDataPath);

  const uploadDir = path.join(userDataPath, "shop_uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const isPackaged = app.isPackaged;

  const pathA = path.join(
    process.resourcesPath,
    "app",
    "backend",
    "server.mjs",
  );
  const pathB = path.join(process.resourcesPath, "backend", "server.mjs");
  const serverPath = isPackaged
    ? fs.existsSync(pathA)
      ? pathA
      : pathB
    : path.join(__dirname, "backend", "server.mjs");

  const backendDir = isPackaged
    ? path.join(process.resourcesPath, "app")
    : __dirname;

  const logPath = path.join(app.getPath("desktop"), "backend-log.txt");
  const logStream = fs.createWriteStream(logPath, { flags: "a" });

  backendProcess = fork(serverPath, [], {
    cwd: backendDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      UPLOAD_DIR: uploadDir,
    },
    silent: true,
  });

  backendProcess.stdout.on("data", (data) => {
    logStream.write(`STDOUT: ${data}\n`);
  });
  backendProcess.stderr.on("data", (data) => {
    logStream.write(`STDERR: ${data}\n`);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});

app.on("before-quit", () => {
  if (backendProcess) backendProcess.kill();
});
