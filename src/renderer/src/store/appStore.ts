import { create } from 'zustand'

export type ModuleName = 'word' | 'excel' | 'powerpoint'

export interface RecentFile {
  path: string
  name: string
  module: ModuleName
  openedAt: number
  favorite?: boolean
}

export type ActiveView =
  | { screen: 'launcher' }
  | { screen: 'word'; filePath: string | null }
  | { screen: 'excel'; filePath: string | null }
  | { screen: 'powerpoint'; filePath: string | null }

interface AppState {
  view: ActiveView
  recents: RecentFile[]
  goToLauncher: () => void
  openModule: (moduleName: ModuleName, filePath: string | null) => void
  setRecents: (recents: RecentFile[]) => void
  refreshRecents: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  view: { screen: 'launcher' },
  recents: [],

  goToLauncher: () => set({ view: { screen: 'launcher' } }),

  openModule: (moduleName, filePath) => set({ view: { screen: moduleName, filePath } }),

  setRecents: (recents) => set({ recents }),

  refreshRecents: async () => {
    const recents = await window.docfile.getRecents()
    set({ recents })
  }
}))
