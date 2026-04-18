const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile:   (content: string) =>
    ipcRenderer.invoke('save-file', content),
  openFile:   () =>
    ipcRenderer.invoke('open-file'),
  exportFile: (content: string, ext: string) =>
    ipcRenderer.invoke('export-file', content, ext),
  exportPNG:  (buffer: ArrayBuffer) =>
    ipcRenderer.invoke('export-png', buffer),
  // Template file handling
  openTemplateFile: () =>
    ipcRenderer.invoke('open-template-file'),
  exportPDF: () =>
    ipcRenderer.invoke('export-pdf'),

  // Listen to menu actions from Electron
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_event: any, action: string) => callback(action));
  },
});
