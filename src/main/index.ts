import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import { initAutoUpdater } from './updater'

interface RecentFile {
  path: string
  name: string
  module: 'word' | 'excel' | 'powerpoint'
  openedAt: number
  favorite?: boolean
}

interface AppSettings {
  spellCheck: boolean
  defaultFont: string
  showWordCount: boolean
}

const store = new Store<{ recents: RecentFile[] }>({
  defaults: { recents: [] }
})

const settingsStore = new Store<AppSettings>({
  name: 'settings',
  defaults: { spellCheck: true, defaultFont: 'Calibri', showWordCount: true }
})

const MODULE_FILTERS: Record<string, Electron.FileFilter[]> = {
  word: [{ name: 'Word Document', extensions: ['docx'] }],
  excel: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
  powerpoint: [{ name: 'PowerPoint Presentation', extensions: ['pptx'] }],
  pdf: [{ name: 'PDF Document', extensions: ['pdf'] }]
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

// Print and PDF export both need to act on ONLY the document's own HTML — not
// whatever the main app window happens to be showing (ribbon, Backstage, etc.) —
// so both render into a throwaway hidden window first.
async function withDocumentWindow<T>(
  html: string,
  action: (win: BrowserWindow) => Promise<T>
): Promise<T> {
  const docWindow = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true }
  })

  try {
    await docWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`)
    return await action(docWindow)
  } finally {
    docWindow.destroy()
  }
}

async function exportHtmlToPdf(html: string): Promise<Uint8Array> {
  return withDocumentWindow(html, async (docWindow) => {
    const pdfBuffer = await docWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true
    })
    return new Uint8Array(pdfBuffer)
  })
}

function printHtml(html: string): Promise<void> {
  return withDocumentWindow(html, (docWindow) => {
    return new Promise<void>((resolve) => {
      docWindow.webContents.print({ silent: false }, () => resolve())
    })
  })
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

  ipcMain.handle('fs:stat', async (_event, filePath: string) => {
    const fs = await import('fs/promises')
    try {
      const stat = await fs.stat(filePath)
      return { size: stat.size, mtimeMs: stat.mtimeMs }
    } catch {
      return null
    }
  })

  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('shell:openExternal', (_event, url: string) => {
    if (typeof url === 'string' && /^https:\/\//.test(url)) {
      shell.openExternal(url)
    }
  })

  ipcMain.handle('shell:showItemInFolder', (_event, filePath: string) => {
    if (typeof filePath === 'string' && filePath) {
      shell.showItemInFolder(filePath)
    }
  })

  ipcMain.handle('print:document', (_event, html: string) => {
    return printHtml(html)
  })

  ipcMain.handle('export:pdf', async (_event, html: string) => {
    return exportHtmlToPdf(html)
  })

  ipcMain.handle('recent:get', () => {
    return store.get('recents', [])
  })

  ipcMain.handle('recent:add', (_event, entry: Omit<RecentFile, 'openedAt' | 'favorite'>) => {
    const recents = store.get('recents', [])
    const existing = recents.find((r) => r.path === entry.path)
    const filtered = recents.filter((r) => r.path !== entry.path)
    const updated: RecentFile[] = [
      { ...entry, openedAt: Date.now(), favorite: existing?.favorite ?? false },
      ...filtered
    ].slice(0, 15)
    store.set('recents', updated)
    return updated
  })

  ipcMain.handle('recent:toggleFavorite', (_event, path: string) => {
    const recents = store.get('recents', [])
    const updated = recents.map((r) => (r.path === path ? { ...r, favorite: !r.favorite } : r))
    store.set('recents', updated)
    return updated
  })

  ipcMain.handle('settings:get', () => {
    return settingsStore.store
  })

  ipcMain.handle('settings:set', (_event, next: Partial<AppSettings>) => {
    settingsStore.set({ ...settingsStore.store, ...next })
    return settingsStore.store
  })
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
