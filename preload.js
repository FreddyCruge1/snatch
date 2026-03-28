const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getSettings:      ()  => ipcRenderer.invoke('get-settings'),
  saveSettings:     s   => ipcRenderer.invoke('save-settings', s),
  getHistory:       ()  => ipcRenderer.invoke('get-history'),
  saveHistory:      h   => ipcRenderer.invoke('save-history', h),
  getInfo:          o   => ipcRenderer.invoke('get-info', o),
  getPlaylist:      o   => ipcRenderer.invoke('get-playlist', o),
  checkDuplicate:   o   => ipcRenderer.invoke('check-duplicate', o),
  download:         o   => ipcRenderer.invoke('download', o),
  updateYtdlp:      ()  => ipcRenderer.invoke('update-ytdlp'),
  openFolder:       p   => ipcRenderer.invoke('open-folder', p),
  openFile:         p   => ipcRenderer.invoke('open-file', p),
  minimize:         ()  => ipcRenderer.send('minimize'),
  maximize:         ()  => ipcRenderer.send('maximize'),
  close:            ()  => ipcRenderer.send('close'),
  onProgress:       cb  => ipcRenderer.on('download-progress', (_, d) => cb(d)),
  onUpdateProgress: cb  => ipcRenderer.on('update-progress', (_, d) => cb(d)),
  getFileBase64:    p   => ipcRenderer.invoke('get-file-base64', p),
  offAll:           ()  => {
    ipcRenderer.removeAllListeners('download-progress')
    ipcRenderer.removeAllListeners('update-progress')
  }
})
