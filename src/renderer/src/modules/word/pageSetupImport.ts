import JSZip from 'jszip'
import {
  DEFAULT_PAGE_SETUP,
  MARGIN_TWIPS,
  PAGE_SIZE_TWIPS,
  type ColumnCount,
  type MarginPreset,
  type PageSetup,
  type PageSizeName
} from './pageSetup'

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

function lastEl(doc: Document, localName: string): Element | null {
  const all = doc.getElementsByTagNameNS(W_NS, localName)
  return all.length ? all[all.length - 1] : null
}

function attrNum(el: Element | null, name: string): number | undefined {
  if (!el) return undefined
  const value = el.getAttributeNS(W_NS, name) ?? el.getAttribute(`w:${name}`)
  const parsed = value !== null ? parseInt(value, 10) : NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

function attrStr(el: Element | null, name: string): string | undefined {
  if (!el) return undefined
  return el.getAttributeNS(W_NS, name) ?? el.getAttribute(`w:${name}`) ?? undefined
}

function closeEnough(a: number, b: number, tolerance = 4): boolean {
  return Math.abs(a - b) <= tolerance
}

function matchPageSize(portraitWidth: number, portraitHeight: number): PageSizeName {
  for (const key of Object.keys(PAGE_SIZE_TWIPS) as PageSizeName[]) {
    const size = PAGE_SIZE_TWIPS[key]
    if (closeEnough(size.width, portraitWidth) && closeEnough(size.height, portraitHeight)) {
      return key
    }
  }
  return DEFAULT_PAGE_SETUP.size
}

function matchMarginPreset(margins: { top: number; bottom: number; left: number; right: number }): MarginPreset {
  for (const key of Object.keys(MARGIN_TWIPS) as Exclude<MarginPreset, 'custom'>[]) {
    const preset = MARGIN_TWIPS[key]
    if (
      closeEnough(preset.top, margins.top) &&
      closeEnough(preset.bottom, margins.bottom) &&
      closeEnough(preset.left, margins.left) &&
      closeEnough(preset.right, margins.right)
    ) {
      return key
    }
  }
  return 'custom'
}

// Reads the real page-setup metadata (size/margins/orientation/columns/line
// numbers/hyphenation) out of a .docx file's own OOXML, so opening a document
// someone else authored in Word shows its actual Layout settings instead of
// silently resetting to our defaults. Mammoth (used for the HTML body import)
// deliberately discards this, so it's parsed independently here.
export async function importPageSetup(data: Uint8Array): Promise<PageSetup> {
  try {
    const zip = await JSZip.loadAsync(data)
    const documentXml = await zip.file('word/document.xml')?.async('string')
    if (!documentXml) return DEFAULT_PAGE_SETUP

    const parser = new DOMParser()
    const doc = parser.parseFromString(documentXml, 'application/xml')
    if (doc.getElementsByTagName('parsererror').length) return DEFAULT_PAGE_SETUP

    const sectPr = lastEl(doc, 'sectPr')
    if (!sectPr) return DEFAULT_PAGE_SETUP

    const pgSz = sectPr.getElementsByTagNameNS(W_NS, 'pgSz')[0] ?? null
    const pgMar = sectPr.getElementsByTagNameNS(W_NS, 'pgMar')[0] ?? null
    const cols = sectPr.getElementsByTagNameNS(W_NS, 'cols')[0] ?? null
    const lnNumType = sectPr.getElementsByTagNameNS(W_NS, 'lnNumType')[0] ?? null

    const rawW = attrNum(pgSz, 'w') ?? PAGE_SIZE_TWIPS.letter.width
    const rawH = attrNum(pgSz, 'h') ?? PAGE_SIZE_TWIPS.letter.height
    const isLandscape = attrStr(pgSz, 'orient') === 'landscape'
    // docx writers (including this app's own exporter) swap w/h for landscape
    // pages, so undo that to match against our portrait-standard size table.
    const portraitW = isLandscape ? rawH : rawW
    const portraitH = isLandscape ? rawW : rawH

    const margins = {
      top: attrNum(pgMar, 'top') ?? MARGIN_TWIPS.normal.top,
      bottom: attrNum(pgMar, 'bottom') ?? MARGIN_TWIPS.normal.bottom,
      left: attrNum(pgMar, 'left') ?? MARGIN_TWIPS.normal.left,
      right: attrNum(pgMar, 'right') ?? MARGIN_TWIPS.normal.right
    }
    const marginPreset = matchMarginPreset(margins)

    const columnsNum = attrNum(cols, 'num') ?? 1
    const columns = (columnsNum >= 3 ? 3 : columnsNum === 2 ? 2 : 1) as ColumnCount

    let hyphenation: PageSetup['hyphenation'] = 'none'
    const settingsXml = await zip.file('word/settings.xml')?.async('string')
    if (settingsXml) {
      const settingsDoc = parser.parseFromString(settingsXml, 'application/xml')
      if (settingsDoc.getElementsByTagNameNS(W_NS, 'autoHyphenation').length) {
        hyphenation = 'auto'
      }
    }

    return {
      marginPreset,
      customMargins:
        marginPreset === 'custom'
          ? {
              top: margins.top / 1440,
              bottom: margins.bottom / 1440,
              left: margins.left / 1440,
              right: margins.right / 1440
            }
          : DEFAULT_PAGE_SETUP.customMargins,
      size: matchPageSize(portraitW, portraitH),
      orientation: isLandscape ? 'landscape' : 'portrait',
      columns,
      lineNumbering: lnNumType ? 'continuous' : 'none',
      hyphenation
    }
  } catch {
    return DEFAULT_PAGE_SETUP
  }
}
