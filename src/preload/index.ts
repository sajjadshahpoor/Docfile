import { contextBridge, ipcRenderer } from 'electron'

export type ModuleName = 'word' | 'excel' | 'powerpoint'

export interface RecentFile {
  path: string
  name: string
  module: ModuleName
  openedAt: number
}

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
    ipcRenderer.invoke('recent:add', entry)
}

contextBridge.exposeInMainWorld('docfile', api)

export type DocfileApi = typeof api
