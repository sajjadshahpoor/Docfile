import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft20Regular, ArrowUndo20Regular, ArrowRedo20Regular, Save20Regular } from '@fluentui/react-icons'
import Ribbon from './Ribbon'
import FindReplace from './FindReplace'
import StatusBar from './StatusBar'
import Ruler from './ribbon/Ruler'
import NavigationPane from './ribbon/NavigationPane'
import Backstage from './backstage/Backstage'
import UnsavedChangesDialog from './UnsavedChangesDialog'
import { importDocx } from './docxImport'
import { exportDocx } from './docxExport'
import { importPageSetup } from './pageSetupImport'
import { useAppStore } from '../../store/appStore'
import { FontSize } from './extensions/fontSize'
import { PageBreak } from './extensions/pageBreak'
import { ParagraphFormatting } from './extensions/paragraphFormatting'
import { UnderlineWithStyle } from './extensions/underlineExtras'
import { StrikeWithDouble } from './extensions/strikeExtras'
import { CharacterSpacing } from './extensions/characterSpacing'
import { TextEffects } from './extensions/textEffects'
import { BookmarkMark } from './extensions/bookmarkMark'
import { CommentMark } from './extensions/commentMark'
import { TrackChanges, TrackInsertMark, TrackDeleteMark, type MarkupView } from './extensions/trackChanges'
import { FootnoteNode } from './extensions/footnoteNode'
import { CitationNode } from './extensions/citationNode'
import { TableOfContentsBlock, TableOfFiguresBlock } from './extensions/referenceBlocks'
import { Pagination } from './extensions/pagination'
import { DEFAULT_PAGE_SETUP, getPreviewDimensions, type PageSetup } from './pageSetup'
import { DEFAULT_HEADER_FOOTER, type HeaderFooterState } from './headerFooter'
import { DEFAULT_DESIGN, type DesignSettings } from './design'
import { DEFAULT_SETTINGS, type AppSettings } from './settings'
import { DEFAULT_VIEW_SETTINGS, type ViewSettings } from './viewSettings'
import { DEFAULT_CITATION_STYLE, type CitationStyle, type Source } from './citations'
import type { DocTemplate } from './templates'

interface WordEditorProps {
  filePath: string | null
}

function fileNameFromPath(path: string | null): string {
  if (!path) return 'Untitled document'
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1]
}

export default function WordEditor({ filePath }: WordEditorProps): JSX.Element {
  const goToLauncher = useAppStore((s) => s.goToLauncher)
  const refreshRecents = useAppStore((s) => s.refreshRecents)
  const recents = useAppStore((s) => s.recents)

  const [currentPath, setCurrentPath] = useState<string | null>(filePath)
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(!!filePath)
  const [isSaving, setIsSaving] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pageSetup, setPageSetup] = useState<PageSetup>(DEFAULT_PAGE_SETUP)
  const [headerFooter, setHeaderFooter] = useState<HeaderFooterState>(DEFAULT_HEADER_FOOTER)
  const [design, setDesign] = useState<DesignSettings>(DEFAULT_DESIGN)
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false)
  const [markupView, setMarkupView] = useState<MarkupView>('all')
  const [zoom, setZoom] = useState(100)
  const [view, setView] = useState<ViewSettings>(DEFAULT_VIEW_SETTINGS)
  const [sources, setSources] = useState<Source[]>([])
  const [citationStyle, setCitationStyle] = useState<CitationStyle>(DEFAULT_CITATION_STYLE)
  const [findReplaceOpen, setFindReplaceOpen] = useState(false)
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [showFormattingMarks, setShowFormattingMarks] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const loadedPathRef = useRef<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ strike: false }),
      StrikeWithDouble,
      UnderlineWithStyle,
      TextStyle,
      FontFamily,
      FontSize,
      CharacterSpacing,
      TextEffects,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Subscript,
      Superscript,
      CharacterCount,
      PageBreak,
      ParagraphFormatting,
      BookmarkMark,
      CommentMark,
      TrackInsertMark,
      TrackDeleteMark,
      TrackChanges,
      FootnoteNode,
      CitationNode,
      TableOfContentsBlock,
      TableOfFiguresBlock,
      Pagination
    ],
    content: '<p></p>',
    editorProps: {
      attributes: { lang: 'en-US' }
    },
    onUpdate: () => setIsDirty(true)
  })

  useEffect(() => {
    window.docfile.getSettings().then(setSettings)
  }, [])

  useEffect(() => {
    if (!editor) return
    editor.view.dom.setAttribute('spellcheck', settings.spellCheck ? 'true' : 'false')
  }, [editor, settings.spellCheck])

  useEffect(() => {
    editor?.setEditable(view.mode !== 'read')
  }, [editor, view.mode])

  useEffect(() => {
    if (!editor) return
    const handler = (): void => {
      const storage = editor.storage.pagination ?? { pageCount: 1, breakPositions: [] }
      setPageCount(storage.pageCount)
      const pos = editor.state.selection.from
      const page = storage.breakPositions.filter((p: number) => p <= pos).length + 1
      setCurrentPage(page)
    }
    handler()
    editor.on('transaction', handler)
    return () => {
      editor.off('transaction', handler)
    }
  }, [editor])

  // Print Layout is the only view that paginates, matching real Word (Draft
  // and Web Layout are continuous). Multi-column layout is skipped too —
  // it's a separate CSS-column flow mode the height math below doesn't
  // account for.
  useEffect(() => {
    if (!editor) return
    const dims = getPreviewDimensions(pageSetup)
    editor.commands.configurePagination({
      enabled: view.mode === 'print' && pageSetup.columns === 1,
      pageContentHeightPx: dims.heightPx - dims.paddingTopPx - dims.paddingBottomPx,
      headerFooter
    })
  }, [editor, view.mode, pageSetup, headerFooter])

  const loadDocument = async (path: string): Promise<void> => {
    if (!editor) return
    loadedPathRef.current = path
    setIsLoading(true)
    setError(null)
    setFileMenuOpen(false)
    try {
      const data = await window.docfile.readFile(path)
      const [result, loadedPageSetup] = await Promise.all([
        importDocx(data),
        importPageSetup(data)
      ])
      editor.commands.setContent(result.html)
      setWarnings(result.warnings)
      setPageSetup(loadedPageSetup)
      setHeaderFooter(DEFAULT_HEADER_FOOTER)
      setDesign(DEFAULT_DESIGN)
      setSources([])
      setCitationStyle(DEFAULT_CITATION_STYLE)
      editor.chain().setTrackChangesEnabled(false).setMarkupView('all').run()
      setTrackChangesEnabled(false)
      setMarkupView('all')
      setCurrentPath(path)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open document')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!editor) return
    if (!filePath || loadedPathRef.current === filePath) return
    loadDocument(filePath)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, filePath])

  const handleSave = async (forcePicker = false): Promise<boolean> => {
    if (!editor) return false
    setIsSaving(true)
    setError(null)
    try {
      let targetPath = currentPath
      if (forcePicker || !targetPath) {
        const picked = await window.docfile.saveFile('word', targetPath ?? 'Untitled.docx')
        if (!picked) return false
        targetPath = picked
      }

      const bytes = await exportDocx(editor.getJSON(), pageSetup, headerFooter, design)
      await window.docfile.writeFile(targetPath, bytes)
      setCurrentPath(targetPath)
      setIsDirty(false)

      await window.docfile.addRecent({
        path: targetPath,
        name: fileNameFromPath(targetPath),
        module: 'word'
      })
      refreshRecents()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Ctrl+S and Ctrl+F only ever worked by clicking their ribbon/toolbar
  // buttons — real Word users reach for these by keyboard first, so wire up
  // the actual shortcuts rather than just documenting ones that don't exist.
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 's') {
        e.preventDefault()
        handleSave(false)
      } else if (key === 'f' && !e.shiftKey && !e.altKey) {
        e.preventDefault()
        setFindReplaceOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  // When an action would discard unsaved changes (close/new/open), it's stashed
  // here and only run once the user resolves the UnsavedChangesDialog — matching
  // Word's real "Do you want to save changes?" Save/Don't Save/Cancel prompt.
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const runGuarded = (action: () => void): void => {
    if (!isDirtyRef.current) {
      action()
      return
    }
    setPendingAction(() => action)
  }

  const resolvePendingSave = async (): Promise<void> => {
    const action = pendingAction
    setPendingAction(null)
    if (!action) return
    const saved = await handleSave(false)
    if (saved) action()
  }

  const resolvePendingDontSave = (): void => {
    const action = pendingAction
    setPendingAction(null)
    action?.()
  }

  const handleClose = (): void => {
    runGuarded(() => {
      setFileMenuOpen(false)
      goToLauncher()
    })
  }

  const handlePickTemplate = (template: DocTemplate): void => {
    if (!editor) return
    runGuarded(() => {
      loadedPathRef.current = null
      setCurrentPath(null)
      setWarnings([])
      setError(null)
      setPageSetup(DEFAULT_PAGE_SETUP)
      setHeaderFooter(DEFAULT_HEADER_FOOTER)
      setDesign(DEFAULT_DESIGN)
      setSources([])
      setCitationStyle(DEFAULT_CITATION_STYLE)
      editor.chain().setTrackChangesEnabled(false).setMarkupView('all').run()
      setTrackChangesEnabled(false)
      setMarkupView('all')
      editor.commands.setContent(template.html)
      if (settings.defaultFont) {
        editor.chain().focus().selectAll().setFontFamily(settings.defaultFont).run()
        editor.commands.setTextSelection(0)
      }
      setIsDirty(false)
      setFileMenuOpen(false)
    })
  }

  const handleOpenRecent = (path: string): void => {
    runGuarded(() => {
      loadDocument(path)
    })
  }

  const handleBrowseOpen = async (): Promise<void> => {
    const picked = await window.docfile.openFile('word')
    if (!picked) return
    runGuarded(() => {
      loadDocument(picked)
    })
  }

  const handleToggleFavorite = async (path: string): Promise<void> => {
    await window.docfile.toggleFavoriteRecent(path)
    refreshRecents()
  }

  const dimensions = getPreviewDimensions(pageSetup)

  const handleFitPageWidth = (): void => {
    const el = scrollContainerRef.current
    if (!el) return
    const available = el.clientWidth - 64
    const nextZoom = Math.max(50, Math.min(200, Math.round((available / dimensions.widthPx) * 100)))
    setZoom(nextZoom)
  }

  const isDraft = view.mode === 'draft'
  const effectiveWidthPx = isDraft ? 700 : dimensions.widthPx
  const effectivePadTopPx = isDraft ? 32 : dimensions.paddingTopPx
  const effectivePadBottomPx = isDraft ? 32 : dimensions.paddingBottomPx
  const effectivePadLeftPx = isDraft ? 32 : dimensions.paddingLeftPx
  const effectivePadRightPx = isDraft ? 32 : dimensions.paddingRightPx

  const isReadMode = view.mode === 'read'

  return (
    <div className="flex h-full flex-col bg-gray-100">
      {isReadMode ? (
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
          <div className="text-sm font-medium text-gray-800">{fileNameFromPath(currentPath)}</div>
          <button
            onClick={() => setView({ ...view, mode: 'print' })}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ✕ Close Read Mode
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-1.5">
            <button
              onClick={handleClose}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              title="Back to launcher"
            >
              <ArrowLeft20Regular className="h-4 w-4" /> Home
            </button>
            <div className="mx-0.5 h-5 w-px bg-gray-200" />
            <button
              title="Undo"
              onClick={() => editor?.chain().focus().undo().run()}
              className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-gray-100"
            >
              <ArrowUndo20Regular className="h-4 w-4" />
            </button>
            <button
              title="Redo"
              onClick={() => editor?.chain().focus().redo().run()}
              className="flex h-7 w-7 items-center justify-center rounded text-gray-600 hover:bg-gray-100"
            >
              <ArrowRedo20Regular className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">
                {fileNameFromPath(currentPath)}
                {isDirty && <span className="text-gray-400"> •</span>}
              </div>
            </div>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-md bg-office-word px-3 py-1.5 text-sm font-medium text-white hover:bg-office-word/90 disabled:opacity-50"
            >
              <Save20Regular className="h-4 w-4" /> {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Save As…
            </button>
          </div>

          <Ribbon
            editor={editor}
            pageSetup={pageSetup}
            onPageSetupChange={setPageSetup}
            headerFooter={headerFooter}
            onHeaderFooterChange={setHeaderFooter}
            design={design}
            onDesignChange={setDesign}
            pageContentHeightPx={dimensions.heightPx - dimensions.paddingTopPx - dimensions.paddingBottomPx}
            trackChangesEnabled={trackChangesEnabled}
            onTrackChangesEnabledChange={setTrackChangesEnabled}
            markupView={markupView}
            onMarkupViewChange={setMarkupView}
            view={view}
            onViewChange={setView}
            sources={sources}
            onSourcesChange={setSources}
            citationStyle={citationStyle}
            onCitationStyleChange={setCitationStyle}
            zoom={zoom}
            onZoomChange={setZoom}
            onFitPageWidth={handleFitPageWidth}
            onToggleFindReplace={() => setFindReplaceOpen((v) => !v)}
            onOpenFileMenu={() => setFileMenuOpen(true)}
            showFormattingMarks={showFormattingMarks}
            onToggleFormattingMarks={() => setShowFormattingMarks((v) => !v)}
          />

          {findReplaceOpen && editor && (
            <FindReplace editor={editor} onClose={() => setFindReplaceOpen(false)} />
          )}

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
              Imported with {warnings.length} formatting note(s) — some advanced Word features may
              not have carried over exactly.
            </div>
          )}
        </>
      )}

      <div className="flex flex-1 overflow-hidden">
        {view.showNavPane && !isReadMode && editor && (
          <NavigationPane editor={editor} onClose={() => setView({ ...view, showNavPane: false })} />
        )}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-8">
          {isLoading ? (
            <div className="text-center text-sm text-gray-500">Opening document…</div>
          ) : (
            <>
              {view.showRuler && (view.mode === 'print' || view.mode === 'web') && (
                <div
                  className="sticky top-0 z-10 mb-1 bg-gray-100 pb-1"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                >
                  <Ruler
                    widthPx={dimensions.widthPx}
                    marginLeftPx={dimensions.paddingLeftPx}
                    marginRightPx={dimensions.paddingRightPx}
                  />
                </div>
              )}
              <div
                className={`docfile-editor mx-auto max-w-full origin-top ${showFormattingMarks ? 'docfile-show-marks' : ''} ${
                  markupView === 'final' ? 'docfile-markup-final' : markupView === 'original' ? 'docfile-markup-original' : ''
                } ${view.mode === 'web' ? 'docfile-view-web' : ''} ${isDraft ? 'docfile-view-draft' : ''}`}
                style={{ width: effectiveWidthPx, transform: `scale(${zoom / 100})` }}
              >
                {headerFooter.showHeader && !isDraft && (
                  <div className="docfile-page mb-2 px-4 py-2 text-sm text-gray-500">
                    <input
                      value={headerFooter.headerText}
                      onChange={(e) =>
                        setHeaderFooter({ ...headerFooter, headerText: e.target.value })
                      }
                      placeholder="Header text"
                      className="w-full border-none bg-transparent outline-none placeholder:text-gray-300"
                    />
                  </div>
                )}
                <div
                  className={`docfile-page relative overflow-hidden ${
                    pageSetup.lineNumbering === 'continuous' ? 'docfile-line-numbers' : ''
                  } ${pageSetup.hyphenation === 'auto' ? 'docfile-hyphenate' : ''}`}
                  style={
                    {
                      '--page-pad-top': `${effectivePadTopPx}px`,
                      '--page-pad-bottom': `${effectivePadBottomPx}px`,
                      '--page-pad-left': `${effectivePadLeftPx}px`,
                      '--page-pad-right': `${effectivePadRightPx}px`,
                      '--page-content-min-height': isDraft ? 'auto' : `${dimensions.heightPx}px`,
                      '--page-columns': pageSetup.columns,
                      backgroundColor: isDraft ? undefined : design.pageColor ?? undefined,
                      border:
                        isDraft || design.pageBorder === 'none'
                          ? undefined
                          : `${design.pageBorder === 'thick' ? 4 : 1.5}px solid ${design.pageBorderColor}`
                    } as CSSProperties
                  }
                >
                  {view.showGridlines && <div className="docfile-gridlines" aria-hidden="true" />}
                  {design.watermarkText && !isDraft && (
                    <div className="docfile-watermark" aria-hidden="true">
                      {design.watermarkText}
                    </div>
                  )}
                  <EditorContent editor={editor} />
                </div>
                {headerFooter.showFooter && !isDraft && (
                  <div className="docfile-page mt-2 px-4 py-2 text-sm text-gray-500">
                    <input
                      value={headerFooter.footerText}
                      onChange={(e) =>
                        setHeaderFooter({ ...headerFooter, footerText: e.target.value })
                      }
                      placeholder="Footer text"
                      className="w-full border-none bg-transparent outline-none placeholder:text-gray-300"
                    />
                    {headerFooter.includePageNumber && (
                      <div className="mt-1 text-center text-xs text-gray-400">
                        Page {pageCount} of {pageCount}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {!isReadMode && (
        <StatusBar
          editor={editor}
          zoom={zoom}
          onZoomChange={setZoom}
          showWordCount={settings.showWordCount}
          currentPage={view.mode === 'print' && pageSetup.columns === 1 ? currentPage : undefined}
          pageCount={view.mode === 'print' && pageSetup.columns === 1 ? pageCount : undefined}
        />
      )}

      {fileMenuOpen && (
        <Backstage
          editor={editor}
          recents={recents}
          currentPath={currentPath}
          fileName={fileNameFromPath(currentPath)}
          pageSetup={pageSetup}
          onDismiss={() => setFileMenuOpen(false)}
          onCloseDocument={handleClose}
          onSave={() => handleSave(false)}
          onSaveAsBrowse={() => handleSave(true)}
          onPickTemplate={handlePickTemplate}
          onOpenRecent={handleOpenRecent}
          onBrowseOpen={handleBrowseOpen}
          onToggleFavorite={handleToggleFavorite}
          onSettingsChange={setSettings}
        />
      )}

      {pendingAction && (
        <UnsavedChangesDialog
          fileName={fileNameFromPath(currentPath)}
          onSave={resolvePendingSave}
          onDontSave={resolvePendingDontSave}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  )
}
