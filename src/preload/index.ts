import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

export type ModuleName = 'word' | 'excel' | 'powerpoint'

export interface RecentFile {
  path: string
  name: string
  module: ModuleName
  openedAt: number
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

  saveFile: (moduleName: ModuleName, defaultName?: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:saveFile', moduleName, defaultName),

  readFile: (filePath: string): Promise<Uint8Array> => ipcRenderer.invoke('fs:readFile', filePath),

  writeFile: (filePath: string, data: Uint8Array): Promise<boolean> =>
    ipcRenderer.invoke('fs:writeFile', filePath, data),

  getRecents: (): Promise<RecentFile[]> => ipcRenderer.invoke('recent:get'),

  addRecent: (entry: Omit<RecentFile, 'openedAt'>): Promise<RecentFile[]> =>
    ipcRenderer.invoke('recent:add', entry),

  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),

  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('update:check'),

  restartAndInstallUpdate: (): Promise<void> => ipcRenderer.invoke('update:restartAndInstall'),

  onUpdateStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, status: UpdateStatus): void => callback(status)
    ipcRenderer.on('update:status', listener)
    return () => ipcRenderer.removeListener('update:status', listener)
  }
}

contextBridge.exposeInMainWorld('docfile', api)

export type DocfileApi = typeof api
