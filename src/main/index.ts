import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { initAutoUpdater } from './updater'

interface RecentFile {
  path: string
  name: string
  module: 'word' | 'excel' | 'powerpoint'
  openedAt: number
}

const store = new Store<{ recents: RecentFile[] }>({
  defaults: { recents: [] }
})

const MODULE_FILTERS: Record<string, Electron.FileFilter[]> = {
  word: [{ name: 'Word Document', extensions: ['docx'] }],
  excel: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
  powerpoint: [{ name: 'PowerPoint Presentation', extensions: ['pptx'] }]
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (app.isPackaged) {
    initAutoUpdater(mainWindow)
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle('dialog:openFile', async (_event, moduleName: keyof typeof MODULE_FILTERS) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: MODULE_FILTERS[moduleName] ?? []
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle(
    'dialog:saveFile',
    async (_event, moduleName: keyof typeof MODULE_FILTERS, defaultName?: string) => {
      const result = await dialog.showSaveDialog({
        defaultPath: defaultName,
        filters: MODULE_FILTERS[moduleName] ?? []
      })
      if (result.canceled || !result.filePath) return null
      return result.filePath
    }
  )

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    const fs = await import('fs/promises')
    const buffer = await fs.readFile(filePath)
    return new Uint8Array(buffer)
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: Uint8Array) => {
    const fs = await import('fs/promises')
    await fs.writeFile(filePath, Buffer.from(data))
    return true
  })

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('shell:openExternal', (_event, url: string) => {
    if (typeof url === 'string' && /^https:\/\//.test(url)) {
      shell.openExternal(url)
    }
  })

  ipcMain.handle('recent:get', () => {
    return store.get('recents', [])
  })

  ipcMain.handle(
    'recent:add',
    (_event, entry: Omit<RecentFile, 'openedAt'>) => {
      const recents = store.get('recents', [])
      const filtered = recents.filter((r) => r.path !== entry.path)
      const updated: RecentFile[] = [{ ...entry, openedAt: Date.now() }, ...filtered].slice(0, 15)
      store.set('recents', updated)
      return updated
    }
  )
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
