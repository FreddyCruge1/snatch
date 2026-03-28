const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

// ── Путь к bin папке (работает и в dev и в production) ──
function getBinPath(filename) {
  if (app.isPackaged) {
    // В собранном приложении: resources/bin/
    return path.join(process.resourcesPath, 'bin', filename)
  } else {
    // В dev режиме: ./bin/
    return path.join(__dirname, 'bin', filename)
  }
}

// ── Settings ──
const settingsPath = path.join(os.homedir(), '.tuitube-settings.json')

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    }
  } catch (e) {}
  // Дефолтные пути — вшитые бинарники
  return {
    ytdlpPath:    getBinPath('yt-dlp.exe'),
    ffmpegPath:   getBinPath('ffmpeg.exe'),
    ffprobePath:  getBinPath('ffprobe.exe'),
    downloadPath: path.join(os.homedir(), 'Downloads')
  }
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 820,
    height: 680,
    minWidth: 680,
    minHeight: 520,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC: load settings
ipcMain.handle('get-settings', () => loadSettings())

// IPC: save settings
ipcMain.handle('save-settings', (_, settings) => {
  saveSettings(settings)
  return true
})

// IPC: window controls
ipcMain.on('minimize', (e) => BrowserWindow.fromWebContents(e.sender).minimize())
ipcMain.on('maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.on('close', (e) => BrowserWindow.fromWebContents(e.sender).close())

// IPC: open folder
ipcMain.handle('open-folder', (_, folderPath) => {
  shell.openPath(folderPath)
})

// IPC: download video
ipcMain.handle('download', (event, { url, format, downloadPath, ytdlpPath, ffmpegPath }) => {
  return new Promise((resolve, reject) => {
    const args = []

    const outputTemplate = path.join(downloadPath, '%(title)s.%(ext)s')
    args.push('-o', outputTemplate)
    args.push('--ffmpeg-location', path.dirname(ffmpegPath))

    if (format === 'audio') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
    } else if (format === 'bestvideo+bestaudio') {
      args.push('-f', 'bestvideo+bestaudio', '--merge-output-format', 'mp4')
    } else {
      const res = format.replace('p', '')
      args.push('-f', `bestvideo[height<=${res}]+bestaudio`, '--merge-output-format', 'mp4')
    }

    args.push('--newline', '--progress')
    args.push(url)

    const proc = spawn(ytdlpPath, args)
    let lastFile = ''

    proc.stdout.on('data', (data) => {
      const text = data.toString()
      const match = text.match(/\[download\]\s+(\d+\.?\d*)%/)
      if (match) {
        event.sender.send('download-progress', {
          percent: parseFloat(match[1]),
          status: text.trim()
        })
      }
      const fileMatch = text.match(/\[Merger\] Merging formats into "(.*?)"/) ||
                        text.match(/Destination: (.+)/)
      if (fileMatch) lastFile = fileMatch[1]
    })

    proc.stderr.on('data', (data) => {
      event.sender.send('download-progress', { percent: -1, status: data.toString().trim() })
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, file: lastFile, downloadPath })
      } else {
        reject(new Error(`yt-dlp завершился с кодом ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Не удалось запустить yt-dlp: ${err.message}`))
    })
  })
})

// IPC: get video info
ipcMain.handle('get-info', async (_, { url, ytdlpPath }) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(ytdlpPath, ['--dump-json', '--no-playlist', url])
    let output = ''
    let errOutput = ''

    proc.stdout.on('data', d => output += d.toString())
    proc.stderr.on('data', d => errOutput += d.toString())

    proc.on('close', (code) => {
      if (code === 0 && output) {
        try {
          const info = JSON.parse(output)
          resolve({
            title: info.title,
            duration: info.duration,
            thumbnail: info.thumbnail,
            uploader: info.uploader
          })
        } catch { reject(new Error('Ошибка парсинга данных')) }
      } else {
        reject(new Error(errOutput || 'Видео не найдено'))
      }
    })

    proc.on('error', err => reject(new Error(`Не удалось запустить yt-dlp: ${err.message}`)))
  })
})
