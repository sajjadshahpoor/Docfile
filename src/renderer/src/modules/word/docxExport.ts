import {
  AlignmentType,
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
  UnderlineType,
  WidthType,
  type ISectionOptions
} from 'docx'
import {
  MARGIN_TWIPS,
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

const INDENT_STEP_TWIPS = 720 // 0.5in per level, Word's standard indent step

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

async function buildTextRuns(nodes: TNode[] | undefined): Promise<(TextRun | ImageRun)[]> {
  if (!nodes) return []
  const runs: (TextRun | ImageRun)[] = []

  for (const node of nodes) {
    if (node.type === 'image') {
      const image = await buildImageRun(node)
      if (image) runs.push(image)
      continue
    }
    if (node.type !== 'text' || !node.text) continue

    const marks = node.marks ?? []
    const isBold = marks.some((m) => m.type === 'bold')
    const isItalic = marks.some((m) => m.type === 'italic')
    const isUnderline = marks.some((m) => m.type === 'underline')
    const isStrike = marks.some((m) => m.type === 'strike')
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

    runs.push(
      new TextRun({
        text: node.text,
        bold: isBold,
        italics: isItalic,
        underline: isUnderline ? { type: UnderlineType.SINGLE } : undefined,
        strike: isStrike,
        subScript: isSubscript,
        superScript: isSuperscript,
        color,
        font: fontFamily,
        size,
        highlight: highlightColor as never,
        style: isLink ? 'Hyperlink' : undefined
      })
    )
  }

  return runs
}

function buildSpacingAndIndent(attrs: Record<string, unknown> | undefined): {
  spacing?: { line?: number; lineRule?: (typeof LineRuleType)[keyof typeof LineRuleType]; before?: number; after?: number }
  indent?: { left: number }
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

  const indentLevel = Number(attrs?.indentLevel ?? 0)
  if (indentLevel > 0) {
    result.indent = { left: indentLevel * INDENT_STEP_TWIPS }
  }

  return result
}

async function buildParagraph(node: TNode, listLevel?: { ordered: boolean; level: number }): Promise<Paragraph> {
  const align = ALIGNMENT_MAP[(node.attrs?.textAlign as string) ?? ''] ?? undefined
  const children = await buildTextRuns(node.content)
  const { spacing, indent } = buildSpacingAndIndent(node.attrs)

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
      bullet: { level: listLevel.level }
    })
  }

  return new Paragraph({ children, alignment: align, heading, spacing, indent })
}

async function buildListItems(
  listNode: TNode,
  ordered: boolean,
  level: number
): Promise<(Paragraph | Table)[]> {
  const out: (Paragraph | Table)[] = []
  for (const item of listNode.content ?? []) {
    for (const child of item.content ?? []) {
      if (child.type === 'bulletList') {
        out.push(...(await buildListItems(child, false, level + 1)))
      } else if (child.type === 'orderedList') {
        out.push(...(await buildListItems(child, true, level + 1)))
      } else {
        out.push(await buildParagraph(child, { ordered, level }))
      }
    }
  }
  return out
}

async function buildTable(node: TNode): Promise<Table> {
  const rows: TableRow[] = []
  for (const rowNode of node.content ?? []) {
    const cells: TableCell[] = []
    for (const cellNode of rowNode.content ?? []) {
      const cellChildren: (Paragraph | Table)[] = []
      for (const child of cellNode.content ?? []) {
        cellChildren.push(...(await buildBlock(child)))
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

async function buildBlock(node: TNode): Promise<(Paragraph | Table)[]> {
  switch (node.type) {
    case 'paragraph':
    case 'heading':
      return [await buildParagraph(node)]
    case 'bulletList':
      return buildListItems(node, false, 0)
    case 'orderedList':
      return buildListItems(node, true, 0)
    case 'table':
      return [await buildTable(node)]
    case 'pageBreak':
      return [new Paragraph({ children: [new DocxPageBreak()] })]
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

  for (const node of root.content ?? []) {
    children.push(...(await buildBlock(node)))
  }

  const margins = MARGIN_TWIPS[pageSetup.marginPreset]
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
        size: {
          width: isLandscape ? size.height : size.width,
          height: isLandscape ? size.width : size.height,
          orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
        },
        margin: {
          top: margins.top,
          bottom: margins.bottom,
          left: margins.left,
          right: margins.right
        }
      }
    },
    headers,
    footers,
    children: children.length ? children : [new Paragraph({})]
  }

  const doc = new Document({
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
