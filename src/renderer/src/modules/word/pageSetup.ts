export type MarginPreset = 'normal' | 'narrow' | 'moderate' | 'wide' | 'custom'
export type PageSizeName = 'letter' | 'legal' | 'a3' | 'a4' | 'a5' | 'tabloid' | 'executive'
export type Orientation = 'portrait' | 'landscape'
export type ColumnCount = 1 | 2 | 3
export type LineNumbering = 'none' | 'continuous'
export type Hyphenation = 'none' | 'auto'

// Inches — the unit Word's own Custom Margins dialog uses.
export interface CustomMargins {
  top: number
  bottom: number
  left: number
  right: number
}

export interface PageSetup {
  marginPreset: MarginPreset
  customMargins: CustomMargins
  size: PageSizeName
  orientation: Orientation
  columns: ColumnCount
  lineNumbering: LineNumbering
  hyphenation: Hyphenation
}

export const DEFAULT_PAGE_SETUP: PageSetup = {
  marginPreset: 'normal',
  customMargins: { top: 1, bottom: 1, left: 1, right: 1 },
  size: 'letter',
  orientation: 'portrait',
  columns: 1,
  lineNumbering: 'none',
  hyphenation: 'none'
}

// All measurements in twips (1440 per inch) — the unit docx/Word use natively.
export const MARGIN_TWIPS: Record<
  Exclude<MarginPreset, 'custom'>,
  { top: number; bottom: number; left: number; right: number }
> = {
  normal: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
  narrow: { top: 720, bottom: 720, left: 720, right: 720 },
  moderate: { top: 1440, bottom: 1440, left: 1080, right: 1080 },
  wide: { top: 1440, bottom: 1440, left: 2880, right: 2880 }
}

export function getMarginTwips(pageSetup: PageSetup): {
  top: number
  bottom: number
  left: number
  right: number
} {
  if (pageSetup.marginPreset === 'custom') {
    const m = pageSetup.customMargins
    return {
      top: Math.round(m.top * 1440),
      bottom: Math.round(m.bottom * 1440),
      left: Math.round(m.left * 1440),
      right: Math.round(m.right * 1440)
    }
  }
  return MARGIN_TWIPS[pageSetup.marginPreset]
}

// Matches the sizes Word's own "Size" gallery offers, in twips (portrait).
export const PAGE_SIZE_TWIPS: Record<PageSizeName, { width: number; height: number }> = {
  letter: { width: 12240, height: 15840 }, // 8.5 x 11"
  legal: { width: 12240, height: 20160 }, // 8.5 x 14"
  a3: { width: 16838, height: 23811 }, // 297 x 420mm
  a4: { width: 11906, height: 16838 }, // 210 x 297mm
  a5: { width: 8391, height: 11906 }, // 148 x 210mm
  tabloid: { width: 15840, height: 24480 }, // 11 x 17"
  executive: { width: 10440, height: 15120 } // 7.25 x 10.5"
}

export const PAGE_SIZE_LABELS: Record<PageSizeName, string> = {
  letter: 'Letter (8.5" x 11")',
  legal: 'Legal (8.5" x 14")',
  a3: 'A3 (297 x 420 mm)',
  a4: 'A4 (210 x 297 mm)',
  a5: 'A5 (148 x 210 mm)',
  tabloid: 'Tabloid (11" x 17")',
  executive: 'Executive (7.25" x 10.5")'
}

const TWIPS_PER_PX = 15 // 1440 twips/in ÷ 96 px/in

export interface PreviewDimensions {
  widthPx: number
  heightPx: number
  paddingTopPx: number
  paddingBottomPx: number
  paddingLeftPx: number
  paddingRightPx: number
}

export function getPreviewDimensions(pageSetup: PageSetup): PreviewDimensions {
  const size = PAGE_SIZE_TWIPS[pageSetup.size]
  const margins = getMarginTwips(pageSetup)
  const widthTwips = pageSetup.orientation === 'landscape' ? size.height : size.width
  const heightTwips = pageSetup.orientation === 'landscape' ? size.width : size.height

  const widthPx = Math.round(widthTwips / TWIPS_PER_PX)
  const heightPx = Math.round(heightTwips / TWIPS_PER_PX)
  const paddingTopPx = Math.round(margins.top / TWIPS_PER_PX)
  const paddingBottomPx = Math.round(margins.bottom / TWIPS_PER_PX)
  const paddingLeftPx = Math.round(margins.left / TWIPS_PER_PX)
  const paddingRightPx = Math.round(margins.right / TWIPS_PER_PX)

  return {
    widthPx,
    heightPx,
    paddingTopPx,
    paddingBottomPx,
    paddingLeftPx,
    paddingRightPx
  }
}
