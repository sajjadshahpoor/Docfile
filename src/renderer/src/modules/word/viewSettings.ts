export type ViewMode = 'print' | 'web' | 'draft' | 'read'

export interface ViewSettings {
  mode: ViewMode
  showRuler: boolean
  showGridlines: boolean
  showNavPane: boolean
}

export const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  mode: 'print',
  showRuler: false,
  showGridlines: false,
  showNavPane: false
}
