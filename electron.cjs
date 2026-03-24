const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs'); 

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Jewellery Shop Manager",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Frontend path is perfectly fine here since it's bundled in 'files'
  mainWindow.loadFile(path.join(__dirname, 'jwelleryshop', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  // 📁 Define a permanent folder in the Device Memory (AppData)
  const userDataPath = app.getPath('userData'); 
  console.log("Your device storage folder is at:", userDataPath);
  
  const uploadDir = path.join(userDataPath, 'shop_uploads');

  // Create the folder if it doesn't exist on this device
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 🔥 CRITICAL FIX: Differentiate between Dev and Prod paths for the backend
  const isPackaged = app.isPackaged;
  const serverPath = isPackaged
    ? path.join(process.resourcesPath, 'backend', 'server.js') // Where the .exe puts it
    : path.join(__dirname, 'backend', 'server.js');            // Where it is in VS Code
  
  const logPath = path.join(app.getPath('desktop'), 'backend-log.txt');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  // Start the backend
  backendProcess = fork(serverPath, [], {
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      // Pass the Device Memory path to the Backend
      UPLOAD_DIR: uploadDir 
    },
    silent: true 
  });

  // Log backend output to desktop file for debugging
  backendProcess.stdout.on('data', (data) => {
    logStream.write(`STDOUT: ${data}\n`);
  });
  backendProcess.stderr.on('data', (data) => {
    logStream.write(`STDERR: ${data}\n`);
  });

  // 🔥 CRITICAL FIX: Actually call the function to create the visible window!
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) backendProcess.kill();
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});