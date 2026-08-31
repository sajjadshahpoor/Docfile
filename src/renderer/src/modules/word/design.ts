export type PageBorderWeight = 'none' | 'single' | 'thick'

export interface DesignSettings {
  pageColor: string | null
  pageBorder: PageBorderWeight
  pageBorderColor: string
  watermarkText: string | null
}

export const DEFAULT_DESIGN: DesignSettings = {
  pageColor: null,
  pageBorder: 'none',
  pageBorderColor: '#2E5B9A',
  watermarkText: null
}

export const WATERMARK_PRESETS = ['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'URGENT', 'SAMPLE']

// Eighths of a point, matching Word's own thin/thick page-border weights.
export const PAGE_BORDER_SIZE: Record<Exclude<PageBorderWeight, 'none'>, number> = {
  single: 8,
  thick: 24
}
