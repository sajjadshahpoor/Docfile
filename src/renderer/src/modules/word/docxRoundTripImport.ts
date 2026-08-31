import JSZip from 'jszip'
import { DEFAULT_DESIGN, type DesignSettings, type PageBorderWeight } from './design'
import { DEFAULT_HEADER_FOOTER, type HeaderFooterState } from './headerFooter'

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

// Minimal shape of a ProseMirror/TipTap JSON node — mirrors the same local
// type docxExport.ts defines, since TipTap doesn't export a public one.
interface TMark {
  type: string
  attrs?: Record<string, unknown>
}
interface TNode {
  type: string
  text?: string
  marks?: TMark[]
}

export interface ParagraphPatch {
  // The plain text mammoth would have produced for this paragraph (deleted
  // text excluded, exactly like mammoth's own w:del handling) — used to find
  // the matching paragraph in the already-imported TipTap doc.
  visibleText: string
  content: TNode[]
}

export interface RoundTripExtras {
  design: DesignSettings
  headerFooter: HeaderFooterState
  paragraphPatches: ParagraphPatch[]
}

function attrStr(el: Element | null, name: string, ns: string = W_NS): string | undefined {
  if (!el) return undefined
  const prefix = ns === R_NS ? 'r' : 'w'
  return el.getAttributeNS(ns, name) ?? el.getAttribute(`${prefix}:${name}`) ?? undefined
}

function attrNum(el: Element | null, name: string): number | undefined {
  const value = attrStr(el, name)
  const parsed = value !== undefined ? parseInt(value, 10) : NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

function firstChildNS(el: Element | null, localName: string): Element | null {
  if (!el) return null
  for (const child of Array.from(el.children)) {
    if (child.localName === localName) return child
  }
  return null
}

function childrenNS(el: Element, localName: string): Element[] {
  return Array.from(el.children).filter((c) => c.localName === localName)
}

// A run-property toggle (<w:b/>) means "on" unless explicitly cancelled with
// w:val="false"/"0" — Word does this to override an inherited style.
function isRunPropOn(rPr: Element | null, tag: string): boolean {
  const el = firstChildNS(rPr, tag)
  if (!el) return false
  const val = el.getAttribute('w:val')
  return val !== '0' && val !== 'false'
}

interface CommentInfo {
  author: string
  date?: string
  text: string
}

async function readComments(zip: JSZip): Promise<Map<string, CommentInfo>> {
  const map = new Map<string, CommentInfo>()
  const xml = await zip.file('word/comments.xml')?.async('string')
  if (!xml) return map
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) return map
  for (const c of Array.from(doc.getElementsByTagNameNS(W_NS, 'comment'))) {
    const id = attrStr(c, 'id')
    if (!id) continue
    const text = Array.from(c.getElementsByTagNameNS(W_NS, 't'))
      .map((t) => t.textContent ?? '')
      .join('')
    map.set(id, {
      author: attrStr(c, 'author') || 'Docfile User',
      date: attrStr(c, 'date'),
      text
    })
  }
  return map
}

function textOfRun(rEl: Element): string {
  let s = ''
  for (const child of Array.from(rEl.children)) {
    if (child.localName === 't' || child.localName === 'delText') s += child.textContent ?? ''
    else if (child.localName === 'tab') s += '\t'
    else if (child.localName === 'br') s += '\n'
  }
  return s
}

// Walks one top-level <w:p>, reconstructing its inline content with the
// marks docxExport.ts's own OOXML shapes imply — bookmarkStart/End,
// commentRangeStart/End (+ commentReference), and w:ins/w:del. Mammoth
// (used for the base import) drops all of these: bookmark/comment ranges
// collapse to a single zero-width marker with no extent, and w:del content
// is dropped outright, so a paragraph using any of them needs reconstructing
// here instead of trusting mammoth's version of it.
function walkParagraph(
  pEl: Element,
  comments: Map<string, CommentInfo>
): { hasSpecial: boolean; visibleText: string; content: TNode[] } {
  const content: TNode[] = []
  let visibleText = ''
  let openBookmark: string | null = null
  let openComment: { id: string; info: CommentInfo } | null = null
  let hasSpecial = false

  const pushRun = (
    text: string,
    formatting: { bold: boolean; italic: boolean; underline: boolean; strike: boolean },
    track: { kind?: 'ins' | 'del'; author?: string; date?: string }
  ): void => {
    if (!text) return
    const marks: TMark[] = []
    if (formatting.bold) marks.push({ type: 'bold' })
    if (formatting.italic) marks.push({ type: 'italic' })
    if (formatting.underline) marks.push({ type: 'underline' })
    if (formatting.strike) marks.push({ type: 'strike' })
    if (openBookmark) {
      marks.push({ type: 'bookmark', attrs: { name: openBookmark } })
      hasSpecial = true
    }
    if (openComment) {
      marks.push({
        type: 'comment',
        attrs: {
          commentId: openComment.id,
          author: openComment.info.author,
          text: openComment.info.text,
          date: openComment.info.date ?? null
        }
      })
      hasSpecial = true
    }
    if (track.kind === 'ins') {
      marks.push({ type: 'trackInsert', attrs: { author: track.author, date: track.date ?? null } })
      hasSpecial = true
    } else if (track.kind === 'del') {
      marks.push({ type: 'trackDelete', attrs: { author: track.author, date: track.date ?? null } })
      hasSpecial = true
    }
    content.push({ type: 'text', text, marks: marks.length ? marks : undefined })
    if (track.kind !== 'del') visibleText += text
  }

  const walkChildren = (container: Element, track: { kind?: 'ins' | 'del'; author?: string; date?: string }): void => {
    for (const child of Array.from(container.children)) {
      switch (child.localName) {
        case 'bookmarkStart': {
          const name = attrStr(child, 'name')
          if (name && name !== '_GoBack') openBookmark = name
          break
        }
        case 'bookmarkEnd':
          openBookmark = null
          break
        case 'commentRangeStart': {
          const id = attrStr(child, 'id')
          const info = id ? comments.get(id) : undefined
          if (id && info) openComment = { id: `rt-${id}`, info }
          break
        }
        case 'commentRangeEnd':
          openComment = null
          break
        case 'r': {
          const rPr = firstChildNS(child, 'rPr')
          pushRun(
            textOfRun(child),
            {
              bold: isRunPropOn(rPr, 'b'),
              italic: isRunPropOn(rPr, 'i'),
              underline: !!firstChildNS(rPr, 'u') && firstChildNS(rPr, 'u')?.getAttribute('w:val') !== 'none',
              strike: isRunPropOn(rPr, 'strike')
            },
            track
          )
          break
        }
        case 'ins':
          walkChildren(child, {
            kind: 'ins',
            author: attrStr(child, 'author') || 'Docfile User',
            date: attrStr(child, 'date')
          })
          break
        case 'del':
          walkChildren(child, {
            kind: 'del',
            author: attrStr(child, 'author') || 'Docfile User',
            date: attrStr(child, 'date')
          })
          break
        case 'hyperlink':
          walkChildren(child, track)
          break
        default:
          break
      }
    }
  }

  walkChildren(pEl, {})
  return { hasSpecial, visibleText, content }
}

async function readParagraphPatches(
  bodyEl: Element,
  comments: Map<string, CommentInfo>
): Promise<ParagraphPatch[]> {
  const patches: ParagraphPatch[] = []
  for (const child of Array.from(bodyEl.children)) {
    if (child.localName !== 'p') continue
    const { hasSpecial, visibleText, content } = walkParagraph(child, comments)
    if (hasSpecial && visibleText) patches.push({ visibleText, content })
  }
  return patches
}

function readDesignFromSectPr(sectPr: Element | null): Pick<DesignSettings, 'pageBorder' | 'pageBorderColor'> {
  const pgBorders = firstChildNS(sectPr, 'pgBorders')
  if (!pgBorders) return { pageBorder: 'none', pageBorderColor: DEFAULT_DESIGN.pageBorderColor }
  const top = firstChildNS(pgBorders, 'top')
  const sz = attrNum(top, 'sz')
  const color = attrStr(top, 'color')
  const pageBorder: PageBorderWeight = sz !== undefined && sz >= 16 ? 'thick' : 'single'
  return {
    pageBorder,
    pageBorderColor: color ? `#${color}` : DEFAULT_DESIGN.pageBorderColor
  }
}

function readPageColor(documentEl: Element): string | null {
  const bg = firstChildNS(documentEl, 'background')
  const color = attrStr(bg, 'color')
  return color ? `#${color}` : null
}

async function resolveRelTarget(zip: JSZip, relsPath: string, rId: string | undefined): Promise<string | null> {
  if (!rId) return null
  const xml = await zip.file(relsPath)?.async('string')
  if (!xml) return null
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  for (const rel of Array.from(doc.getElementsByTagName('Relationship'))) {
    if (rel.getAttribute('Id') === rId) {
      const target = rel.getAttribute('Target')
      return target ? `word/${target.replace(/^\/?word\//, '')}` : null
    }
  }
  return null
}

// A watermark paragraph is identifiable by its own oversized run size —
// docxExport.ts always writes it at 144 half-points (72pt); nothing else
// this app puts in a header/footer comes close to that.
const WATERMARK_MIN_HALF_POINTS = 100

function paragraphText(pEl: Element): string {
  return Array.from(pEl.getElementsByTagNameNS(W_NS, 't'))
    .map((t) => t.textContent ?? '')
    .join('')
}

function isWatermarkParagraph(pEl: Element): boolean {
  for (const r of childrenNS(pEl, 'r')) {
    const rPr = firstChildNS(r, 'rPr')
    const sz = attrNum(firstChildNS(rPr, 'sz'), 'val')
    if (sz !== undefined && sz >= WATERMARK_MIN_HALF_POINTS) return true
  }
  return false
}

function isPageNumberParagraph(pEl: Element): boolean {
  return Array.from(pEl.getElementsByTagNameNS(W_NS, 'instrText')).some((el) =>
    (el.textContent ?? '').includes('PAGE')
  )
}

async function readHeaderFooterPart(
  zip: JSZip,
  path: string | null,
  isFooter: boolean
): Promise<{ text: string; watermarkText: string | null; includePageNumber: boolean }> {
  if (!path) return { text: '', watermarkText: null, includePageNumber: false }
  const xml = await zip.file(path)?.async('string')
  if (!xml) return { text: '', watermarkText: null, includePageNumber: false }
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) {
    return { text: '', watermarkText: null, includePageNumber: false }
  }
  const root = doc.getElementsByTagNameNS(W_NS, isFooter ? 'ftr' : 'hdr')[0]
  if (!root) return { text: '', watermarkText: null, includePageNumber: false }

  const textParts: string[] = []
  let watermarkText: string | null = null
  let includePageNumber = false

  for (const p of childrenNS(root, 'p')) {
    if (!isFooter && isWatermarkParagraph(p)) {
      watermarkText = paragraphText(p)
      continue
    }
    if (isPageNumberParagraph(p)) {
      includePageNumber = true
      continue
    }
    const text = paragraphText(p)
    if (text) textParts.push(text)
  }

  return { text: textParts.join(' '), watermarkText, includePageNumber }
}

const DEFAULT_EXTRAS: RoundTripExtras = {
  design: DEFAULT_DESIGN,
  headerFooter: DEFAULT_HEADER_FOOTER,
  paragraphPatches: []
}

// Recovers the pieces of a .docx that mammoth (used for the base HTML
// import) either drops entirely or flattens away: page background/border,
// the watermark, header/footer text, and — via a raw walk of document.xml —
// bookmark, comment, and tracked-change ranges, which mammoth reduces to a
// zero-width marker (bookmarks), a range with no extent (comments), or
// (for tracked deletions) nothing at all. Everything here was previously
// export-only; this closes that gap so Docfile's own saved files round-trip.
export async function importRoundTripExtras(data: Uint8Array): Promise<RoundTripExtras> {
  try {
    const zip = await JSZip.loadAsync(data)
    const documentXml = await zip.file('word/document.xml')?.async('string')
    if (!documentXml) return DEFAULT_EXTRAS

    const doc = new DOMParser().parseFromString(documentXml, 'application/xml')
    if (doc.getElementsByTagName('parsererror').length) return DEFAULT_EXTRAS

    const documentEl = doc.getElementsByTagNameNS(W_NS, 'document')[0] ?? null
    const body = doc.getElementsByTagNameNS(W_NS, 'body')[0] ?? null
    if (!documentEl || !body) return DEFAULT_EXTRAS

    const sectPrs = doc.getElementsByTagNameNS(W_NS, 'sectPr')
    const sectPr = sectPrs.length ? sectPrs[sectPrs.length - 1] : null

    const headerRef = Array.from(doc.getElementsByTagNameNS(W_NS, 'headerReference')).find(
      (el) => attrStr(el, 'type') === 'default'
    )
    const footerRef = Array.from(doc.getElementsByTagNameNS(W_NS, 'footerReference')).find(
      (el) => attrStr(el, 'type') === 'default'
    )
    const headerPath = await resolveRelTarget(
      zip,
      'word/_rels/document.xml.rels',
      headerRef ? attrStr(headerRef, 'id', R_NS) : undefined
    )
    const footerPath = await resolveRelTarget(
      zip,
      'word/_rels/document.xml.rels',
      footerRef ? attrStr(footerRef, 'id', R_NS) : undefined
    )

    const [headerInfo, footerInfo, comments] = await Promise.all([
      readHeaderFooterPart(zip, headerPath, false),
      readHeaderFooterPart(zip, footerPath, true),
      readComments(zip)
    ])

    const headerFooter: HeaderFooterState = {
      headerText: headerInfo.text,
      footerText: footerInfo.text,
      showHeader: !!headerInfo.text,
      // footer1.xml only ever exists when showFooter was true (unlike the
      // header, which can exist for a watermark alone) — see docxExport.ts.
      showFooter: !!footerPath,
      includePageNumber: footerInfo.includePageNumber
    }

    const design: DesignSettings = {
      pageColor: readPageColor(documentEl),
      watermarkText: headerInfo.watermarkText,
      ...readDesignFromSectPr(sectPr)
    }

    const paragraphPatches = await readParagraphPatches(body, comments)

    return { design, headerFooter, paragraphPatches }
  } catch {
    return DEFAULT_EXTRAS
  }
}
