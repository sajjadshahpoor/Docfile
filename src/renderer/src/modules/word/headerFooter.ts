export interface HeaderFooterState {
  headerText: string
  footerText: string
  showHeader: boolean
  showFooter: boolean
  includePageNumber: boolean
}

export const DEFAULT_HEADER_FOOTER: HeaderFooterState = {
  headerText: '',
  footerText: '',
  showHeader: false,
  showFooter: false,
  includePageNumber: false
}
