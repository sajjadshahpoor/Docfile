export interface FontPair {
  id: string
  label: string
  headingFont: string
  bodyFont: string
}

export const FONT_PAIRS: FontPair[] = [
  { id: 'office', label: 'Office (Calibri Light / Calibri)', headingFont: 'Calibri Light', bodyFont: 'Calibri' },
  { id: 'classic', label: 'Classic (Cambria / Georgia)', headingFont: 'Cambria', bodyFont: 'Georgia' },
  { id: 'modern', label: 'Modern (Segoe UI)', headingFont: 'Segoe UI', bodyFont: 'Segoe UI' },
  { id: 'traditional', label: 'Traditional (Times New Roman)', headingFont: 'Times New Roman', bodyFont: 'Times New Roman' },
  { id: 'formal', label: 'Formal (Garamond / Georgia)', headingFont: 'Garamond', bodyFont: 'Georgia' }
]

export interface ColorTheme {
  id: string
  label: string
  accent: string
}

export const COLOR_THEMES: ColorTheme[] = [
  { id: 'blue', label: 'Blue', accent: '#2E5B9A' },
  { id: 'green', label: 'Green', accent: '#2E7D32' },
  { id: 'red', label: 'Red', accent: '#B71C1C' },
  { id: 'purple', label: 'Purple', accent: '#6A1B9A' },
  { id: 'orange', label: 'Orange', accent: '#E65100' },
  { id: 'gray', label: 'Grayscale', accent: '#424242' }
]

export interface SpacingPreset {
  id: string
  label: string
  before: number
  after: number
  line: string
}

export const SPACING_PRESETS: SpacingPreset[] = [
  { id: 'compact', label: 'Compact', before: 0, after: 4, line: '1' },
  { id: 'tight', label: 'Tight', before: 0, after: 6, line: '1.08' },
  { id: 'default', label: 'Default', before: 0, after: 8, line: '1.15' },
  { id: 'relaxed', label: 'Relaxed', before: 6, after: 10, line: '1.5' },
  { id: 'double', label: 'Double', before: 6, after: 10, line: '2' }
]

export interface StyleSet {
  id: string
  label: string
  fontPairId: string
  colorThemeId: string
  spacingId: string
}

export const STYLE_SETS: StyleSet[] = [
  { id: 'default', label: 'Default (Office)', fontPairId: 'office', colorThemeId: 'blue', spacingId: 'default' },
  { id: 'minimalist', label: 'Minimalist', fontPairId: 'modern', colorThemeId: 'gray', spacingId: 'compact' },
  { id: 'classic', label: 'Classic', fontPairId: 'classic', colorThemeId: 'red', spacingId: 'relaxed' },
  { id: 'bold', label: 'Bold Headings', fontPairId: 'traditional', colorThemeId: 'purple', spacingId: 'default' }
]

export function findFontPair(id: string): FontPair {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0]
}

export function findColorTheme(id: string): ColorTheme {
  return COLOR_THEMES.find((c) => c.id === id) ?? COLOR_THEMES[0]
}

export function findSpacingPreset(id: string): SpacingPreset {
  return SPACING_PRESETS.find((s) => s.id === id) ?? SPACING_PRESETS[2]
}
