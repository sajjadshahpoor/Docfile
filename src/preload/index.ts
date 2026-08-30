import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

export type ModuleName = 'word' | 'excel' | 'powerpoint'

export interface RecentFile {
  path: string
  name: string
  module: ModuleName
  openedAt: number
  favorite?: boolean
}

export interface FileStat {
  size: number
  mtimeMs: number
}

export interface AppSettings {
  spellCheck: boolean
  defaultFont: string
  showWordCount: boolean
}

export type UpdateStatus =
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

const api = {
  openFile: (moduleName: ModuleName): Promise<string | null> =>
    ipcRenderer.invoke('dialog:openFile', moduleName),

  saveFile: (moduleName: ModuleName | 'pdf', defaultName?: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:saveFile', moduleName, defaultName),

  readFile: (filePath: string): Promise<Uint8Array> => ipcRenderer.invoke('fs:readFile', filePath),

  writeFile: (filePath: string, data: Uint8Array): Promise<boolean> =>
    ipcRenderer.invoke('fs:writeFile', filePath, data),

  statFile: (filePath: string): Promise<FileStat | null> => ipcRenderer.invoke('fs:stat', filePath),

  getRecents: (): Promise<RecentFile[]> => ipcRenderer.invoke('recent:get'),

  addRecent: (entry: Omit<RecentFile, 'openedAt' | 'favorite'>): Promise<RecentFile[]> =>
    ipcRenderer.invoke('recent:add', entry),

  toggleFavoriteRecent: (path: string): Promise<RecentFile[]> =>
    ipcRenderer.invoke('recent:toggleFavorite', path),

  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),

  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),

  showItemInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('shell:showItemInFolder', filePath),

  printDocument: (html: string): Promise<void> => ipcRenderer.invoke('print:document', html),

  exportPdf: (html: string): Promise<Uint8Array> => ipcRenderer.invoke('export:pdf', html),

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),

  setSettings: (next: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:set', next),

  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('update:check'),

  restartAndInstallUpdate: (): Promise<void> => ipcRenderer.invoke('update:restartAndInstall'),

  getUpdateStatus: (): Promise<UpdateStatus | null> => ipcRenderer.invoke('update:getStatus'),

  onUpdateStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, status: UpdateStatus): void => callback(status)
    ipcRenderer.on('update:status', listener)
    return () => ipcRenderer.removeListener('update:status', listener)
  }
}

contextBridge.exposeInMainWorld('docfile', api)

export type DocfileApi = typeof api
