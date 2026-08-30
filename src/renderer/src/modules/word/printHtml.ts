import { PAGE_SIZE_TWIPS, getMarginTwips, type PageSetup } from './pageSetup'

const TWIPS_PER_INCH = 1440

function toInches(twips: number): number {
  return twips / TWIPS_PER_INCH
}

// Builds a fully standalone HTML document (own inline CSS, no dependency on the
// app's bundled stylesheet) for the hidden print/export window in the main
// process — that window loads a bare data: URL and can't reach our CSS bundle.
export function buildPrintableHtml(contentHtml: string, pageSetup: PageSetup): string {
  const size = PAGE_SIZE_TWIPS[pageSetup.size]
  const margins = getMarginTwips(pageSetup)
  const isLandscape = pageSetup.orientation === 'landscape'
  const pageWidthIn = toInches(isLandscape ? size.height : size.width)
  const pageHeightIn = toInches(isLandscape ? size.width : size.height)

  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="UTF-8" />
<style>
  @page {
    size: ${pageWidthIn}in ${pageHeightIn}in;
    margin: ${toInches(margins.top)}in ${toInches(margins.right)}in ${toInches(margins.bottom)}in ${toInches(margins.left)}in;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    font-size: 15px;
    line-height: 1.5;
    color: #1f1f1f;
    column-count: ${pageSetup.columns};
    column-gap: 36px;
    ${pageSetup.hyphenation === 'auto' ? 'hyphens: auto;' : ''}
  }
  p { margin: 0 0 8px 0; }
  h1, h2, h3, h4, h5, h6 { font-weight: 600; line-height: 1.3; margin: 20px 0 8px 0; }
  h1 { font-size: 28px; }
  h2 { font-size: 24px; }
  h3 { font-size: 20px; }
  h4 { font-size: 17px; }
  h5 { font-size: 15px; }
  h6 { font-size: 14px; }
  table { border-collapse: collapse; margin: 1rem 0; }
  table td, table th { border: 1px solid #999; padding: 4px 8px; min-width: 60px; vertical-align: top; }
  table th { background-color: #f1f3f5; font-weight: 600; }
  img { max-width: 100%; height: auto; }
  ul { list-style: disc; padding-left: 1.5rem; }
  ol { list-style: decimal; padding-left: 1.5rem; }
  blockquote { margin: 12px 0; padding-left: 16px; border-left: 3px solid #c7cdd6; color: #55606e; font-style: italic; }
  div[data-page-break] { break-after: page; height: 0; }
</style>
</head>
<body>${contentHtml}</body>
</html>`
}
