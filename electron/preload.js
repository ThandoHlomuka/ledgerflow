const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  exportData: (data) => ipcRenderer.invoke('export-data', data),
  exportCSV: (content, filename) => ipcRenderer.invoke('export-csv', { content, filename }),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action))
});
