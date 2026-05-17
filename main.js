const { app, BrowserWindow, protocol, net } = require("electron");
const path = require("path");

let mainWindow;

// 1. Daftarkan skema custom agar diakui seperti http:// standar
protocol.registerSchemesAsPrivileged([
  { 
    scheme: 'app', 
    privileges: { 
      standard: true, 
      secure: true, 
      supportFetchAPI: true, 
      corsEnabled: true,
      bypassCSP: true
    } 
  }
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "BookLify",
    backgroundColor: "#0c0c0e",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  if (app.isPackaged) {
    // 2. Tangani semua request (navigasi, asset, gambar) menggunakan protokol app://
    protocol.handle('app', (request) => {
      // Contoh request.url: "app://-/search" atau "app://-/_next/static/..."
      let urlPath = request.url.replace('app://-/', '');
      
      // Bersihkan query & hash
      urlPath = urlPath.split('?')[0];
      urlPath = urlPath.split('#')[0];

      // Jika URL kosong, arahkan ke index.html
      if (!urlPath || urlPath === '') {
        urlPath = 'index.html';
      }

      // Next.js App Router static export (trailingSlash: true) mengubah /search menjadi /search/index.html
      if (!urlPath.includes('.')) {
        if (!urlPath.endsWith('/')) urlPath += '/';
        urlPath += 'index.html';
      }

      // Gabungkan dengan path lokal PC
      const finalPath = path.join(__dirname, 'out', urlPath);
      
      // Kembalikan file menggunakan API fetch bawaan Electron
      return net.fetch('file://' + finalPath);
    });

    // Mulai dari root
    mainWindow.loadURL('app://-/');
  } else {
    mainWindow.loadURL("http://localhost:3000");
  }

  // Buka DevTools saat debug/testing
  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
