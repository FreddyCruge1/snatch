const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  download: (opts) => ipcRenderer.invoke('download', opts),
  getInfo: (opts) => ipcRenderer.invoke('get-info', opts),
  openFolder: (p) => ipcRenderer.invoke('open-folder', p),
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
  onProgress: (cb) => ipcRenderer.on('download-progress', (_, data) => cb(data)),
  offProgress: () => ipcRenderer.removeAllListeners('download-progress')
})
