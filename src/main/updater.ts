import { BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

export type UpdateStatus =
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

let mainWindowRef: BrowserWindow | null = null
// The renderer's UpdateBanner subscribes on mount, which can happen after
// the main process has already fired (and lost) earlier events — webContents.send
// doesn't replay to late listeners. Tracking the last status lets a
// just-mounted renderer ask "what's the current status?" instead of only
// hearing about whatever happens to fire after it's ready.
let lastStatus: UpdateStatus | null = null

function send(status: UpdateStatus): void {
  lastStatus = status
  if (!mainWindowRef || mainWindowRef.isDestroyed()) return
  mainWindowRef.webContents.send('update:status', status)
}

// electron-updater only works against a packaged, installed app (it reads
// metadata electron-builder writes next to the installed exe) — running it in
// dev mode just throws, so this is only ever wired up when app.isPackaged.
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => send({ state: 'checking' }))
  autoUpdater.on('update-available', (info) => send({ state: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => send({ state: 'not-available' }))
  autoUpdater.on('download-progress', (progress) =>
    send({ state: 'downloading', percent: Math.round(progress.percent) })
  )
  autoUpdater.on('update-downloaded', (info) => send({ state: 'downloaded', version: info.version }))
  autoUpdater.on('error', (err) => send({ state: 'error', message: err.message }))

  ipcMain.handle('update:check', () => {
    autoUpdater.checkForUpdates().catch((err) => send({ state: 'error', message: String(err) }))
  })

  ipcMain.handle('update:restartAndInstall', () => {
    autoUpdater.quitAndInstall()
  })

  ipcMain.handle('update:getStatus', () => lastStatus)

  // Check shortly after launch rather than blocking startup on it.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => send({ state: 'error', message: String(err) }))
  }, 3000)
}
