const { app, BrowserWindow, ipcMain, shell, Notification, protocol, net } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

// ── Bin paths ──
function getBin(name) {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'bin', name)
    : path.join(__dirname, 'bin', name)
}

const YTDLP   = getBin('yt-dlp.exe')
const FFMPEG  = getBin('ffmpeg.exe')
const FFPROBE = getBin('ffprobe.exe')

// ── Settings ──
const SETTINGS_PATH = path.join(os.homedir(), '.snatch-settings.json')
const HISTORY_PATH  = path.join(os.homedir(), '.snatch-history.json')

function defaultSettings() {
  return {
    downloadPath: path.join(os.homedir(), 'Downloads'),
    theme: 'dark',
    autoSort: true,
    autoPaste: true,
    threads: 4,
    autoRetry: true,
    retryCount: 3
  }
}

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH))
      return { ...defaultSettings(), ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')) }
  } catch (e) {}
  return defaultSettings()
}

function saveSettings(s) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2))
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_PATH))
      return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'))
  } catch (e) {}
  return []
}

function saveHistory(h) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(h, null, 2))
}

function getSubfolder(url, isAudio) {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    const siteMap = {
      'youtube.com': 'YouTube', 'youtu.be': 'YouTube',
      'twitter.com': 'Twitter', 'x.com': 'Twitter',
      'instagram.com': 'Instagram',
      'tiktok.com': 'TikTok',
      'twitch.tv': 'Twitch',
      'reddit.com': 'Reddit',
      'vk.com': 'VK',
      'bilibili.com': 'Bilibili',
      'facebook.com': 'Facebook',
    }
    const site = siteMap[host] || host
    return isAudio ? path.join('Music', site) : path.join('Videos', site)
  } catch { return isAudio ? 'Music' : 'Videos' }
}

function checkDuplicate(title, folder) {
  try {
    if (!fs.existsSync(folder)) return false
    const files = fs.readdirSync(folder)
    const clean = title.toLowerCase().replace(/[^a-z0-9]/g, '')
    return files.some(f => f.toLowerCase().replace(/[^a-z0-9]/g, '').includes(clean.slice(0, 20)))
  } catch { return false }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 900, height: 700,
    minWidth: 720, minHeight: 560,
    frame: false,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('index.html')
}

// ── Register localfile:// protocol for video player ──
app.whenReady().then(() => {
  protocol.handle('localfile', async (request) => {
    try {
      const encoded = request.url.slice('localfile://'.length)
      const filePath = decodeURIComponent(encoded)
      // Read file directly and return as response
      const fs2 = require('fs')
      const data = fs2.readFileSync(filePath)
      const ext = filePath.split('.').pop().toLowerCase()
      const mimeMap = { mp4: 'video/mp4', mkv: 'video/x-matroska', webm: 'video/webm', mp3: 'audio/mpeg', m4a: 'audio/mp4', avi: 'video/x-msvideo', mov: 'video/quicktime' }
      const mime = mimeMap[ext] || 'application/octet-stream'
      return new Response(data, { status: 200, headers: { 'Content-Type': mime, 'Content-Length': data.length } })
    } catch(e) {
      return new Response('Error: ' + e.message, { status: 500 })
    }
  })
  createWindow()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

ipcMain.handle('get-settings', () => loadSettings())
ipcMain.handle('save-settings', (_, s) => { saveSettings(s); return true })
ipcMain.handle('get-history',   () => loadHistory())
ipcMain.handle('save-history',  (_, h) => { saveHistory(h); return true })
ipcMain.handle('open-folder',   (_, p) => shell.openPath(p))
ipcMain.handle('open-file',     (_, p) => shell.openPath(p))

// Return file as base64 for player (avoids encoding issues with cyrillic paths)
ipcMain.handle('get-file-base64', (_, filePath) => {
  try {
    const fs2 = require('fs')
    const data = fs2.readFileSync(filePath)
    const ext = filePath.split('.').pop().toLowerCase()
    const mimeMap = { mp4: 'video/mp4', mkv: 'video/x-matroska', webm: 'video/webm', mp3: 'audio/mpeg', m4a: 'audio/mp4', avi: 'video/x-msvideo', mov: 'video/quicktime' }
    const mime = mimeMap[ext] || 'video/mp4'
    return { base64: data.toString('base64'), mime }
  } catch(e) {
    throw new Error('Cannot read file: ' + e.message)
  }
})
ipcMain.on('minimize', e => BrowserWindow.fromWebContents(e.sender).minimize())
ipcMain.on('maximize', e => {
  const w = BrowserWindow.fromWebContents(e.sender)
  w.isMaximized() ? w.unmaximize() : w.maximize()
})
ipcMain.on('close', e => BrowserWindow.fromWebContents(e.sender).close())

ipcMain.handle('get-info', (_, { url, useCookies, cookiesBrowser, cookiesFile }) => new Promise((resolve, reject) => {
  const infoArgs = ['--dump-json', '--no-playlist']
  const cookiesFilePath2 = cookiesFile ? cookiesFile.replace(/\\/g, '/') : ''
  if (cookiesFilePath2 && fs.existsSync(cookiesFilePath2)) {
    infoArgs.push('--cookies', cookiesFilePath2)
  } else if (useCookies && cookiesBrowser) {
    infoArgs.push('--cookies-from-browser', cookiesBrowser)
  }
  infoArgs.push(url)
  const proc = spawn(YTDLP, infoArgs)
  let out = '', err = ''
  proc.stdout.on('data', d => out += d)
  proc.stderr.on('data', d => err += d)
  proc.on('close', code => {
    if (code === 0 && out) {
      try {
        const i = JSON.parse(out)
        resolve({ title: i.title, duration: i.duration, thumbnail: i.thumbnail, uploader: i.uploader })
      } catch { reject(new Error('Ошибка парсинга')) }
    } else reject(new Error(err || 'Видео не найдено'))
  })
  proc.on('error', e => reject(new Error('Не удалось запустить yt-dlp: ' + e.message)))
}))

ipcMain.handle('get-playlist', (_, { url }) => new Promise((resolve, reject) => {
  const proc = spawn(YTDLP, ['--flat-playlist', '--dump-json', url])
  let out = '', err = ''
  proc.stdout.on('data', d => out += d)
  proc.stderr.on('data', d => err += d)
  proc.on('close', code => {
    if (code === 0 && out) {
      try {
        const items = out.trim().split('\n').map(l => JSON.parse(l))
        resolve({ count: items.length, items: items.slice(0, 3).map(i => i.title) })
      } catch { reject(new Error('Не удалось получить плейлист')) }
    } else reject(new Error(err || 'Плейлист не найден'))
  })
  proc.on('error', e => reject(new Error(e.message)))
}))

ipcMain.handle('check-duplicate', (_, { title, downloadPath, url, isAudio, autoSort }) => {
  const folder = autoSort
    ? path.join(downloadPath, getSubfolder(url, isAudio))
    : downloadPath
  return checkDuplicate(title, folder)
})

ipcMain.handle('update-ytdlp', event => new Promise((resolve, reject) => {
  const proc = spawn(YTDLP, ['-U'])
  proc.stdout.on('data', d => event.sender.send('update-progress', d.toString()))
  proc.stderr.on('data', d => event.sender.send('update-progress', d.toString()))
  proc.on('close', code => code === 0 ? resolve(true) : reject(new Error('Обновление не удалось')))
  proc.on('error', e => reject(new Error(e.message)))
}))

ipcMain.handle('download', (event, { url, format, downloadPath, autoSort, threads, autoRetry, retryCount, title, useCookies, cookiesBrowser, cookiesFile }) => {
  return new Promise((resolve, reject) => {
    const isAudio = format === 'audio'
    const subfolder = autoSort ? getSubfolder(url, isAudio) : ''
    const outFolder = autoSort ? path.join(downloadPath, subfolder) : downloadPath

    if (!fs.existsSync(outFolder)) fs.mkdirSync(outFolder, { recursive: true })

    const outputTemplate = path.join(outFolder, '%(title)s.%(ext)s')
    const args = ['-o', outputTemplate, '--ffmpeg-location', path.dirname(FFMPEG)]

    // Cookies: file takes priority over browser
    const cookiesFilePath = cookiesFile ? cookiesFile.replace(/\\/g, '/') : ''
    if (cookiesFilePath && fs.existsSync(cookiesFilePath)) {
      args.push('--cookies', cookiesFilePath)
    } else if (useCookies && cookiesBrowser) {
      args.push('--cookies-from-browser', cookiesBrowser)
    }

    if (threads > 1) args.push('--concurrent-fragments', String(threads))
    if (autoRetry) args.push('--retries', String(retryCount))

    if (isAudio) {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0')
    } else if (format === 'bestvideo+bestaudio') {
      // Try bestvideo+bestaudio first, fall back to 'b' for sites like VK
      args.push('-f', 'bestvideo+bestaudio/b', '--merge-output-format', 'mp4')
    } else {
      const res = format.replace('p', '')
      args.push('-f', `bestvideo[height<=${res}]+bestaudio/best[height<=${res}]/b`, '--merge-output-format', 'mp4')
    }

    args.push('--newline', '--progress', url)
    console.log('[Snatch] yt-dlp args:', args.join(' '))

    const proc = spawn(YTDLP, args, { encoding: 'buffer' })

    proc.stdout.on('data', data => {
      const text = data.toString('utf8')
      const match = text.match(/\[download\]\s+(\d+\.?\d*)%/)
      if (match) event.sender.send('download-progress', { percent: parseFloat(match[1]), status: text.trim() })
    })

    proc.stderr.on('data', d => event.sender.send('download-progress', { percent: -1, status: d.toString('utf8').trim() }))

    proc.on('close', code => {
      if (code === 0) {
        if (Notification.isSupported()) {
          new Notification({ title: 'Snatch', body: `✓ ${title || 'Видео'} скачано!` }).show()
        }
        // Find newest file and rename to safe ASCII name for IPC transfer
        try {
          const files = fs.readdirSync(outFolder)
            .map(f => ({ name: f, time: fs.statSync(path.join(outFolder, f)).mtimeMs }))
            .sort((a, b) => b.time - a.time)
          if (files.length > 0) {
            const origName = files[0].name
            const ext = path.extname(origName)
            const safeName = 'snatch_' + Date.now() + ext
            const origPath = path.join(outFolder, origName)
            const safePath = path.join(outFolder, safeName)
            fs.renameSync(origPath, safePath)
            resolve({ success: true, file: safePath, displayName: origName, downloadPath: outFolder, subfolder })
          } else {
            resolve({ success: true, file: '', downloadPath: outFolder, subfolder })
          }
        } catch(e) {
          resolve({ success: true, file: '', downloadPath: outFolder, subfolder })
        }
      } else {
        reject(new Error(`yt-dlp завершился с кодом ${code}`))
      }
    })

    proc.on('error', e => reject(new Error('Не удалось запустить yt-dlp: ' + e.message)))
  })
})
