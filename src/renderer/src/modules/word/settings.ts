export interface AppSettings {
  spellCheck: boolean
  defaultFont: string
  showWordCount: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  spellCheck: true,
  defaultFont: 'Calibri',
  showWordCount: true
}
