const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

/* ─── Config ─── */
const isDev = !app.isPackaged;
const PORT = 3000;
const DEV_URL = `http://localhost:${PORT}`;

let mainWindow;

/* ─── App Window ─── */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '..', 'icon.png'),
    title: 'LedgerFlow — Intelligent Accounting',
    backgroundColor: '#FDF8F0',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const startPath = isDev ? DEV_URL : `file://${path.join(__dirname, '..', 'index.html')}`;
  mainWindow.loadURL(startPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

/* ─── Application Menu ─── */
function buildMenu() {
  const template = [
    {
      label: 'LedgerFlow',
      submenu: [
        { label: 'About LedgerFlow', click: () => dialog.showMessageBox(mainWindow, {
          type: 'info', title: 'About LedgerFlow',
          message: 'LedgerFlow v1.0.0',
          detail: 'Intelligent Accounting & Bookkeeping System\nDeveloped by Thando Hlomuka\n\nAll Rights Reserved.'
        })},
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Dashboard', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.executeJavaScript('switchModule("dashboard")') },
        { label: 'Chart of Accounts', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.executeJavaScript('switchModule("accounts")') },
        { label: 'General Ledger', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.executeJavaScript('switchModule("ledger")') },
        { label: 'Accounts Receivable', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.webContents.executeJavaScript('switchModule("receivables")') },
        { label: 'Accounts Payable', accelerator: 'CmdOrCtrl+5', click: () => mainWindow?.webContents.executeJavaScript('switchModule("payables")') },
        { label: 'Bank Accounts', accelerator: 'CmdOrCtrl+6', click: () => mainWindow?.webContents.executeJavaScript('switchModule("banking")') },
        { label: 'Journal Entries', accelerator: 'CmdOrCtrl+7', click: () => mainWindow?.webContents.executeJavaScript('switchModule("journal")') },
        { label: 'Financial Reports', accelerator: 'CmdOrCtrl+8', click: () => mainWindow?.webContents.executeJavaScript('switchModule("reports")') },
        { label: 'Budget & Planning', accelerator: 'CmdOrCtrl+9', click: () => mainWindow?.webContents.executeJavaScript('switchModule("budget")') },
        { label: 'Settings', accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.executeJavaScript('switchModule("settings")') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Keyboard Shortcuts', click: () => mainWindow?.webContents.executeJavaScript('LedgerAI.chat("help").then(r => { document.getElementById("ai-chat-messages").innerHTML += `<div class="chat-msg bot"><div class="chat-bubble bot-bubble">${r.bot}</div></div>`; document.getElementById("ai-chat-panel")?.classList.add("open"); })') },
        { type: 'separator' },
        { label: 'About Developer', click: () => shell.openExternal('https://github.com/ThandoHlomuka') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/* ─── IPC: Export Data ─── */
ipcMain.handle('export-data', async (event, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Data',
    defaultPath: `ledgerflow-export-${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }, { name: 'All Files', extensions: ['*'] }]
  });
  if (!canceled && filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, path: filePath };
  }
  return { success: false };
});

ipcMain.handle('export-csv', async (event, { content, filename }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export CSV',
    defaultPath: filename || `ledgerflow-export-${Date.now()}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }, { name: 'All Files', extensions: ['*'] }]
  });
  if (!canceled && filePath) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true, path: filePath };
  }
  return { success: false };
});

/* ─── App Lifecycle ─── */
app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
