import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'

export interface PaginationHeaderFooter {
  headerText: string
  footerText: string
  showHeader: boolean
  showFooter: boolean
  includePageNumber: boolean
}

export interface PaginationConfig {
  enabled: boolean
  pageContentHeightPx: number
  headerFooter: PaginationHeaderFooter
}

export interface PaginationStorage {
  pageCount: number
  breakPositions: number[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pagination: {
      configurePagination: (config: Partial<PaginationConfig>) => ReturnType
    }
  }
}

const paginationKey = new PluginKey<DecorationSet>('pagination')

// computeDecorations always returns a fresh DecorationSet instance, so
// comparing it by reference to the previous one is never useful — compare
// what actually determines its content instead, to tell whether a redispatch
// is needed at all. Without this, the view's own decoration-only dispatch
// would re-trigger `update()`, which would dispatch again, forever.
function signatureFor(breakPositions: number[]): string {
  return `${breakPositions.join(',')}::${JSON.stringify(liveConfig.headerFooter)}`
}

// Only Print Layout paginates (matching real Word — Draft/Web Layout are
// continuous), so this module-level config is fine even though several
// editor instances could theoretically exist: only one is ever mounted at a
// time in this app.
let liveConfig: PaginationConfig = {
  enabled: false,
  pageContentHeightPx: 1000,
  headerFooter: {
    headerText: '',
    footerText: '',
    showHeader: false,
    showFooter: false,
    includePageNumber: false
  }
}

// offsetHeight/marginBottom are layout-box measurements, unaffected by the
// CSS `transform: scale()` zoom applied further up the tree — so this stays
// correct at any zoom level without needing to recompute on zoom change.
function measure(dom: HTMLElement): number {
  const marginBottom = parseFloat(getComputedStyle(dom).marginBottom) || 0
  return dom.offsetHeight + marginBottom
}

function buildBand(kind: 'header' | 'footer', pageNumber: number, pageCount: number): HTMLDivElement {
  const { headerFooter } = liveConfig
  const band = document.createElement('div')
  band.className = `docfile-page-band docfile-page-band-${kind}`
  const show = kind === 'header' ? headerFooter.showHeader : headerFooter.showFooter
  const text = kind === 'header' ? headerFooter.headerText : headerFooter.footerText
  if (show && text) {
    const textEl = document.createElement('div')
    textEl.className = 'docfile-page-band-text'
    textEl.textContent = text
    band.appendChild(textEl)
  }
  if (kind === 'footer' && headerFooter.includePageNumber) {
    const num = document.createElement('div')
    num.className = 'docfile-page-number'
    num.textContent = `Page ${pageNumber} of ${pageCount}`
    band.appendChild(num)
  }
  return band
}

// The visible gap between two page "sheets" — a decoration widget, so it's
// pure view content: never part of the document, never saved/exported,
// never touches undo history.
function buildGap(endingPage: number, pageCount: number): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.className = 'docfile-page-gap'
  wrap.contentEditable = 'false'
  wrap.appendChild(buildBand('footer', endingPage, pageCount))
  const strip = document.createElement('div')
  strip.className = 'docfile-page-sheet-gap'
  wrap.appendChild(strip)
  wrap.appendChild(buildBand('header', endingPage + 1, pageCount))
  return wrap
}

// Walks the document's top-level blocks, accumulating rendered heights to
// find where each one would overflow the page's usable content height —
// breaks always fall between two top-level blocks (a paragraph/table/etc.
// is never split mid-block across a page), and a manual page-break node
// always forces one. That's a real simplification against Word's exact
// line-by-line reflow, but keeps this from having to reimplement text
// layout — and it's a much closer approximation than the single
// continuously-scrolling sheet this replaces.
function computeDecorations(
  view: EditorView
): { set: DecorationSet; pageCount: number; breakPositions: number[] } {
  const { state } = view
  if (!liveConfig.enabled) return { set: DecorationSet.empty, pageCount: 1, breakPositions: [] }

  const threshold = liveConfig.pageContentHeightPx
  const breakPositions: number[] = []
  let running = 0
  let firstOnPage = true

  state.doc.forEach((node, offset) => {
    const dom = view.nodeDOM(offset)
    const height = dom instanceof HTMLElement ? measure(dom) : 0

    if (!firstOnPage && running + height > threshold) {
      breakPositions.push(offset)
      running = 0
      firstOnPage = true
    }

    running += height
    firstOnPage = false

    if (node.type.name === 'pageBreak') {
      breakPositions.push(offset + node.nodeSize)
      running = 0
      firstOnPage = true
    }
  })

  const pageCount = breakPositions.length + 1
  // The key must change whenever the rendered content would (header/footer
  // text, page numbers) — ProseMirror reuses a widget's existing DOM across
  // redraws for any decoration whose key it already has, skipping the
  // factory function entirely, so a key based on position alone would leave
  // stale header/footer text on screen after an edit.
  const hfSignature = JSON.stringify(liveConfig.headerFooter)
  const decorations = breakPositions.map((pos, i) =>
    Decoration.widget(pos, () => buildGap(i + 1, pageCount), {
      side: -1,
      key: `pgap-${pos}-${pageCount}-${hfSignature}`
    })
  )
  return { set: DecorationSet.create(state.doc, decorations), pageCount, breakPositions }
}

export const Pagination = Extension.create<Record<string, never>, PaginationStorage>({
  name: 'pagination',

  addStorage() {
    return { pageCount: 1, breakPositions: [] }
  },

  addCommands() {
    return {
      configurePagination:
        (config) =>
        ({ editor, view }) => {
          liveConfig = { ...liveConfig, ...config }
          const { set, pageCount, breakPositions } = computeDecorations(view)
          editor.storage.pagination.pageCount = pageCount
          editor.storage.pagination.breakPositions = breakPositions
          view.dispatch(view.state.tr.setMeta(paginationKey, set))
          return true
        }
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      new Plugin({
        key: paginationKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(paginationKey)
            if (meta) return meta
            return old.map(tr.mapping, tr.doc)
          }
        },
        props: {
          decorations(state) {
            return paginationKey.getState(state)
          }
        },
        view(editorView) {
          let scheduled = false
          let lastSignature: string | null = null
          const run = (): void => {
            scheduled = false
            if (!liveConfig.enabled) return
            const { set, pageCount, breakPositions } = computeDecorations(editorView)
            const signature = signatureFor(breakPositions)
            if (signature === lastSignature) return
            lastSignature = signature
            editor.storage.pagination.pageCount = pageCount
            editor.storage.pagination.breakPositions = breakPositions
            editorView.dispatch(editorView.state.tr.setMeta(paginationKey, set))
          }
          const schedule = (): void => {
            if (scheduled || !liveConfig.enabled) return
            scheduled = true
            requestAnimationFrame(run)
          }
          schedule()
          return { update: () => schedule() }
        }
      })
    ]
  }
})
