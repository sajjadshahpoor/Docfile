import {
  AlignmentType,
  Bookmark,
  BorderStyle,
  CommentRangeEnd,
  CommentRangeStart,
  CommentReference,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LineRuleType,
  Packer,
  PageBreak as DocxPageBreak,
  PageNumber,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  LineNumberRestartFormat,
  UnderlineType,
  WidthType,
  type IBordersOptions,
  type ICommentOptions,
  type ISectionOptions,
  type ParagraphChild
} from 'docx'
import {
  getMarginTwips,
  PAGE_SIZE_TWIPS,
  DEFAULT_PAGE_SETUP,
  type PageSetup
} from './pageSetup'
import { DEFAULT_HEADER_FOOTER, type HeaderFooterState } from './headerFooter'

// Minimal shape of a ProseMirror/TipTap JSON node — TipTap doesn't export a
// public node-JSON type, so we model just the fields this converter reads.
interface TNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TNode[]
  text?: string
  marks?: { type: string; attrs?: Record<string, unknown> }[]
}

const HEADING_LEVELS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6
]

const ALIGNMENT_MAP: Record<string, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED
}

const HIGHLIGHT_MAP: Record<string, string> = {
  yellow: 'yellow',
  green: 'green',
  cyan: 'cyan',
  magenta: 'magenta',
  blue: 'blue',
  red: 'red',
  darkblue: 'darkBlue',
  darkcyan: 'darkCyan',
  darkgreen: 'darkGreen',
  darkmagenta: 'darkMagenta',
  darkred: 'darkRed',
  darkyellow: 'darkYellow',
  lightgray: 'lightGray',
  black: 'black'
}

const UNDERLINE_STYLE_MAP: Record<string, (typeof UnderlineType)[keyof typeof UnderlineType]> = {
  solid: UnderlineType.SINGLE,
  double: UnderlineType.DOUBLE,
  dotted: UnderlineType.DOTTED,
  dashed: UnderlineType.DASH,
  wavy: UnderlineType.WAVE
}

function characterSpacingToDxa(value: unknown): number | undefined {
  // letter-spacing in px (see extensions/characterSpacing.ts) -> twentieths of a point.
  if (typeof value !== 'string') return undefined
  const px = parseFloat(value)
  if (!Number.isFinite(px)) return undefined
  return Math.round(px * 15) // 1px ≈ 0.75pt ≈ 15 dxa at 96dpi
}

function normalizeColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const hexMatch = value.match(/^#?([0-9a-fA-F]{6})$/)
  if (hexMatch) return hexMatch[1].toUpperCase()

  const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1).map(Number)
    return [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()
  }
  return undefined
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/)
  if (!match) return null
  const mime = match[1]
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { bytes, mime }
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth || 300, height: img.naturalHeight || 200 })
    img.onerror = () => resolve({ width: 300, height: 200 })
    img.src = src
  })
}

function scaleToFit(width: number, height: number, maxWidth = 560): { width: number; height: number } {
  if (width <= maxWidth) return { width, height }
  const ratio = maxWidth / width
  return { width: maxWidth, height: Math.round(height * ratio) }
}

async function buildImageRun(node: TNode): Promise<ImageRun | null> {
  const src = node.attrs?.src
  if (typeof src !== 'string') return null

  const parsed = dataUrlToBytes(src)
  if (!parsed) return null

  const extMatch = parsed.mime.match(/image\/(png|jpe?g|gif|bmp)/i)
  const rawExt = extMatch?.[1].toLowerCase()
  const type = (rawExt === 'jpeg' ? 'jpg' : rawExt) as 'png' | 'jpg' | 'gif' | 'bmp' | undefined
  if (!type) return null

  const dims = await getImageDimensions(src)
  const { width, height } = scaleToFit(dims.width, dims.height)

  return new ImageRun({
    data: parsed.bytes,
    type,
    transformation: { width, height }
  })
}

function fontSizeToHalfPoints(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined
  const pt = parseFloat(value)
  return Number.isFinite(pt) ? Math.round(pt * 2) : undefined
}

// Threaded through the whole export so every paragraph shares one numbering
// sequence for comment ids and only registers each comment's text once, even
// though the same comment mark can recur across several text nodes/paragraphs.
interface ExportState {
  commentNumericIds: Map<string, number>
  registeredComments: Set<number>
  comments: ICommentOptions[]
  nextCommentNumericId: number
}

function createExportState(): ExportState {
  return { commentNumericIds: new Map(), registeredComments: new Set(), comments: [], nextCommentNumericId: 1 }
}

function getCommentNumericId(state: ExportState, markCommentId: string): number {
  let id = state.commentNumericIds.get(markCommentId)
  if (id === undefined) {
    id = state.nextCommentNumericId++
    state.commentNumericIds.set(markCommentId, id)
  }
  return id
}

// Builds a paragraph's inline content, wrapping runs in Bookmark/CommentRange
// markers where the corresponding TipTap marks are present. Bookmarks nest
// inside comment ranges (Bookmark wraps only its own runs; CommentRangeStart/
// End are flat siblings), so whenever either marker changes we close the
// bookmark first, then the comment, before reopening whichever is still active.
async function buildParagraphChildren(
  nodes: TNode[] | undefined,
  state: ExportState
): Promise<ParagraphChild[]> {
  if (!nodes) return []
  const out: ParagraphChild[] = []

  let openCommentId: string | null = null
  let openCommentNumericId: number | null = null
  let openBookmarkName: string | null = null
  let bookmarkBuffer: ParagraphChild[] = []

  const flushBookmark = (): void => {
    if (openBookmarkName && bookmarkBuffer.length) {
      out.push(new Bookmark({ id: openBookmarkName, children: bookmarkBuffer }))
    } else if (bookmarkBuffer.length) {
      out.push(...bookmarkBuffer)
    }
    bookmarkBuffer = []
    openBookmarkName = null
  }

  const closeComment = (): void => {
    if (openCommentNumericId !== null) {
      out.push(new CommentRangeEnd(openCommentNumericId))
      out.push(new TextRun({ children: [new CommentReference(openCommentNumericId)] }))
    }
    openCommentId = null
    openCommentNumericId = null
  }

  const pushChild = (child: ParagraphChild): void => {
    if (openBookmarkName) bookmarkBuffer.push(child)
    else out.push(child)
  }

  for (const node of nodes) {
    if (node.type === 'image') {
      const image = await buildImageRun(node)
      if (image) pushChild(image)
      continue
    }
    if (node.type !== 'text' || !node.text) continue

    const marks = node.marks ?? []
    const commentMark = marks.find((m) => m.type === 'comment')
    const bookmarkMark = marks.find((m) => m.type === 'bookmark')
    const commentId = (commentMark?.attrs?.commentId as string) ?? null
    const bookmarkName = (bookmarkMark?.attrs?.name as string) ?? null

    if (commentId !== openCommentId || bookmarkName !== openBookmarkName) {
      flushBookmark()
      if (commentId !== openCommentId) {
        closeComment()
        if (commentId) {
          const numericId = getCommentNumericId(state, commentId)
          out.push(new CommentRangeStart(numericId))
          if (!state.registeredComments.has(numericId)) {
            state.registeredComments.add(numericId)
            state.comments.push({
              id: numericId,
              author: (commentMark?.attrs?.author as string) || 'Docfile User',
              date: commentMark?.attrs?.date
                ? new Date(commentMark.attrs.date as string)
                : new Date(),
              children: [new Paragraph({ children: [new TextRun((commentMark?.attrs?.text as string) || '')] })]
            })
          }
          openCommentId = commentId
          openCommentNumericId = numericId
        }
      }
      openBookmarkName = bookmarkName
    }
    const isBold = marks.some((m) => m.type === 'bold')
    const isItalic = marks.some((m) => m.type === 'italic')
    const underlineMark = marks.find((m) => m.type === 'underline')
    const strikeMark = marks.find((m) => m.type === 'strike')
    const isLink = marks.find((m) => m.type === 'link')
    const isSubscript = marks.some((m) => m.type === 'subscript')
    const isSuperscript = marks.some((m) => m.type === 'superscript')
    const textStyleMark = marks.find((m) => m.type === 'textStyle')
    const highlightMark = marks.find((m) => m.type === 'highlight')

    const color = normalizeColor(textStyleMark?.attrs?.color)
    const fontFamily =
      typeof textStyleMark?.attrs?.fontFamily === 'string'
        ? (textStyleMark.attrs.fontFamily as string)
        : undefined
    const size = fontSizeToHalfPoints(textStyleMark?.attrs?.fontSize)
    const highlightColor =
      typeof highlightMark?.attrs?.color === 'string'
        ? HIGHLIGHT_MAP[(highlightMark.attrs.color as string).toLowerCase()]
        : undefined

    const underlineType = underlineMark
      ? UNDERLINE_STYLE_MAP[(underlineMark.attrs?.underlineStyle as string) ?? 'solid'] ?? UnderlineType.SINGLE
      : undefined
    const underlineColor = normalizeColor(underlineMark?.attrs?.underlineColor)
    const isDoubleStrike = !!strikeMark?.attrs?.double
    const characterSpacing = characterSpacingToDxa(textStyleMark?.attrs?.characterSpacing)

    pushChild(
      new TextRun({
        text: node.text,
        bold: isBold,
        italics: isItalic,
        underline: underlineMark ? { type: underlineType, color: underlineColor } : undefined,
        strike: !!strikeMark && !isDoubleStrike,
        doubleStrike: isDoubleStrike,
        subScript: isSubscript,
        superScript: isSuperscript,
        color,
        font: fontFamily,
        size,
        smallCaps: !!textStyleMark?.attrs?.smallCaps,
        allCaps: !!textStyleMark?.attrs?.allCaps,
        characterSpacing,
        highlight: highlightColor as never,
        style: isLink ? 'Hyperlink' : undefined
      })
    )
  }

  flushBookmark()
  closeComment()

  return out
}

function buildSpacingAndIndent(attrs: Record<string, unknown> | undefined): {
  spacing?: { line?: number; lineRule?: (typeof LineRuleType)[keyof typeof LineRuleType]; before?: number; after?: number }
  indent?: { left?: number; right?: number; firstLine?: number; hanging?: number }
} {
  const result: ReturnType<typeof buildSpacingAndIndent> = {}

  const lineHeight = attrs?.lineHeight
  const spacingBefore = attrs?.spacingBefore
  const spacingAfter = attrs?.spacingAfter
  if (lineHeight || spacingBefore || spacingAfter) {
    result.spacing = {
      ...(lineHeight
        ? { line: Math.round(240 * parseFloat(String(lineHeight))), lineRule: LineRuleType.AUTO }
        : {}),
      ...(spacingBefore ? { before: Math.round(Number(spacingBefore) * 20) } : {}),
      ...(spacingAfter ? { after: Math.round(Number(spacingAfter) * 20) } : {})
    }
  }

  const indentLeft = Number(attrs?.indentLeft ?? 0)
  const indentRight = Number(attrs?.indentRight ?? 0)
  const firstLineIndent = Number(attrs?.firstLineIndent ?? 0)
  if (indentLeft > 0 || indentRight > 0 || firstLineIndent) {
    result.indent = {
      ...(indentLeft > 0 ? { left: Math.round(indentLeft * 1440) } : {}),
      ...(indentRight > 0 ? { right: Math.round(indentRight * 1440) } : {}),
      ...(firstLineIndent > 0
        ? { firstLine: Math.round(firstLineIndent * 1440) }
        : firstLineIndent < 0
          ? { hanging: Math.round(Math.abs(firstLineIndent) * 1440) }
          : {})
    }
  }

  return result
}

function buildShadingAndBorder(attrs: Record<string, unknown> | undefined): {
  shading?: { fill: string }
  border?: IBordersOptions
} {
  const result: ReturnType<typeof buildShadingAndBorder> = {}

  const shadingColor = normalizeColor(attrs?.shading)
  if (shadingColor) result.shading = { fill: shadingColor }

  const border = attrs?.border as string | undefined
  if (border && border !== 'none') {
    const line = { style: BorderStyle.SINGLE, size: 6, color: '1F1F1F' }
    if (border === 'all') {
      result.border = { top: line, bottom: line, left: line, right: line }
    } else if (border === 'bottom') {
      result.border = { bottom: line }
    } else if (border === 'top') {
      result.border = { top: line }
    }
  }

  return result
}

async function buildParagraph(
  node: TNode,
  state: ExportState,
  listLevel?: { ordered: boolean; level: number }
): Promise<Paragraph> {
  const align = ALIGNMENT_MAP[(node.attrs?.textAlign as string) ?? ''] ?? undefined
  const children = await buildParagraphChildren(node.content, state)
  const { spacing, indent } = buildSpacingAndIndent(node.attrs)
  const { shading, border } = buildShadingAndBorder(node.attrs)

  const heading =
    node.type === 'heading'
      ? HEADING_LEVELS[Math.min(Math.max(Number(node.attrs?.level ?? 1) - 1, 0), 5)]
      : undefined

  if (listLevel?.ordered) {
    return new Paragraph({
      children,
      alignment: align,
      heading,
      spacing,
      indent,
      shading,
      border,
      numbering: { reference: 'docfile-numbered-list', level: listLevel.level }
    })
  }

  if (listLevel && !listLevel.ordered) {
    return new Paragraph({
      children,
      alignment: align,
      heading,
      spacing,
      indent,
      shading,
      border,
      bullet: { level: listLevel.level }
    })
  }

  return new Paragraph({ children, alignment: align, heading, spacing, indent, shading, border })
}

async function buildListItems(
  listNode: TNode,
  ordered: boolean,
  level: number,
  state: ExportState
): Promise<(Paragraph | Table)[]> {
  const out: (Paragraph | Table)[] = []
  for (const item of listNode.content ?? []) {
    for (const child of item.content ?? []) {
      if (child.type === 'bulletList') {
        out.push(...(await buildListItems(child, false, level + 1, state)))
      } else if (child.type === 'orderedList') {
        out.push(...(await buildListItems(child, true, level + 1, state)))
      } else {
        out.push(await buildParagraph(child, state, { ordered, level }))
      }
    }
  }
  return out
}

async function buildTable(node: TNode, state: ExportState): Promise<Table> {
  const rows: TableRow[] = []
  for (const rowNode of node.content ?? []) {
    const cells: TableCell[] = []
    for (const cellNode of rowNode.content ?? []) {
      const cellChildren: (Paragraph | Table)[] = []
      for (const child of cellNode.content ?? []) {
        cellChildren.push(...(await buildBlock(child, state)))
      }
      cells.push(
        new TableCell({
          children: cellChildren.length ? cellChildren : [new Paragraph({})],
          columnSpan: Number(cellNode.attrs?.colspan ?? 1),
          rowSpan: Number(cellNode.attrs?.rowspan ?? 1)
        })
      )
    }
    rows.push(new TableRow({ children: cells }))
  }
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
}

async function buildBlock(node: TNode, state: ExportState): Promise<(Paragraph | Table)[]> {
  switch (node.type) {
    case 'paragraph':
    case 'heading':
      return [await buildParagraph(node, state)]
    case 'bulletList':
      return buildListItems(node, false, 0, state)
    case 'orderedList':
      return buildListItems(node, true, 0, state)
    case 'table':
      return [await buildTable(node, state)]
    case 'pageBreak':
      return [new Paragraph({ children: [new DocxPageBreak()] })]
    case 'image': {
      // Tiptap's Image node is block-level by default (a sibling of
      // paragraphs, not inline content inside one), so it needs its own
      // top-level case here — without it, every inserted picture/shape was
      // silently dropped on export.
      const image = await buildImageRun(node)
      return [new Paragraph({ children: image ? [image] : [] })]
    }
    default:
      return []
  }
}

export async function exportDocx(
  docJson: unknown,
  pageSetup: PageSetup = DEFAULT_PAGE_SETUP,
  headerFooter: HeaderFooterState = DEFAULT_HEADER_FOOTER
): Promise<Uint8Array> {
  const root = docJson as TNode
  const children: (Paragraph | Table)[] = []
  const state = createExportState()

  for (const node of root.content ?? []) {
    children.push(...(await buildBlock(node, state)))
  }

  const margins = getMarginTwips(pageSetup)
  const size = PAGE_SIZE_TWIPS[pageSetup.size]
  const isLandscape = pageSetup.orientation === 'landscape'

  const headers = headerFooter.showHeader
    ? {
        default: new Header({
          children: [new Paragraph({ children: [new TextRun(headerFooter.headerText)] })]
        })
      }
    : undefined

  const footers = headerFooter.showFooter
    ? {
        default: new Footer({
          children: [
            new Paragraph({ children: [new TextRun(headerFooter.footerText)] }),
            ...(headerFooter.includePageNumber
              ? [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ children: ['Page ', PageNumber.CURRENT] })]
                  })
                ]
              : [])
          ]
        })
      }
    : undefined

  const section: ISectionOptions = {
    properties: {
      page: {
        // docx's own Section builder swaps width/height internally based on
        // `orientation`, so these must stay the portrait-standard values —
        // pre-swapping here would double-swap and silently re-emit a
        // portrait-shaped page with only the orientation flag set to landscape.
        size: {
          width: size.width,
          height: size.height,
          orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
        },
        margin: {
          top: margins.top,
          bottom: margins.bottom,
          left: margins.left,
          right: margins.right
        }
      },
      column:
        pageSetup.columns > 1
          ? { count: pageSetup.columns, space: 720, equalWidth: true }
          : undefined,
      lineNumbers:
        pageSetup.lineNumbering === 'continuous'
          ? { countBy: 1, restart: LineNumberRestartFormat.CONTINUOUS, distance: 360 }
          : undefined
    },
    headers,
    footers,
    children: children.length ? children : [new Paragraph({})]
  }

  const doc = new Document({
    hyphenation: { autoHyphenation: pageSetup.hyphenation === 'auto' },
    comments: state.comments.length ? { children: state.comments } : undefined,
    numbering: {
      config: [
        {
          reference: 'docfile-numbered-list',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } }
            },
            {
              level: 1,
              format: 'lowerLetter',
              text: '%2.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 1440, hanging: 360 } } }
            }
          ]
        }
      ]
    },
    sections: [section]
  })

  const blob = await Packer.toBlob(doc)
  const arrayBuffer = await blob.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}
