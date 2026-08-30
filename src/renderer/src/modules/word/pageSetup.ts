export type MarginPreset = 'normal' | 'narrow' | 'moderate' | 'wide'
export type PageSizeName = 'letter' | 'a4' | 'legal'
export type Orientation = 'portrait' | 'landscape'

export interface PageSetup {
  marginPreset: MarginPreset
  size: PageSizeName
  orientation: Orientation
}

export const DEFAULT_PAGE_SETUP: PageSetup = {
  marginPreset: 'normal',
  size: 'letter',
  orientation: 'portrait'
}

// All measurements in twips (1440 per inch) — the unit docx/Word use natively.
export const MARGIN_TWIPS: Record<
  MarginPreset,
  { top: number; bottom: number; left: number; right: number }
> = {
  normal: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
  narrow: { top: 720, bottom: 720, left: 720, right: 720 },
  moderate: { top: 1440, bottom: 1440, left: 1080, right: 1080 },
  wide: { top: 1440, bottom: 1440, left: 2880, right: 2880 }
}

export const PAGE_SIZE_TWIPS: Record<PageSizeName, { width: number; height: number }> = {
  letter: { width: 12240, height: 15840 },
  a4: { width: 11906, height: 16838 },
  legal: { width: 12240, height: 20160 }
}

const TWIPS_PER_PX = 15 // 1440 twips/in ÷ 96 px/in

export interface PreviewDimensions {
  widthPx: number
  paddingTopPx: number
  paddingBottomPx: number
  paddingLeftPx: number
  paddingRightPx: number
}

export function getPreviewDimensions(pageSetup: PageSetup): PreviewDimensions {
  const size = PAGE_SIZE_TWIPS[pageSetup.size]
  const margins = MARGIN_TWIPS[pageSetup.marginPreset]
  const widthTwips = pageSetup.orientation === 'landscape' ? size.height : size.width

  return {
    widthPx: Math.round(widthTwips / TWIPS_PER_PX),
    paddingTopPx: Math.round(margins.top / TWIPS_PER_PX),
    paddingBottomPx: Math.round(margins.bottom / TWIPS_PER_PX),
    paddingLeftPx: Math.round(margins.left / TWIPS_PER_PX),
    paddingRightPx: Math.round(margins.right / TWIPS_PER_PX)
  }
}
