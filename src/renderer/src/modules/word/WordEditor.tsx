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
import { useEffect, useRef, useState } from 'react'
import Ribbon from './Ribbon'
import FindReplace from './FindReplace'
import StatusBar from './StatusBar'
import Backstage from './backstage/Backstage'
import UnsavedChangesDialog from './UnsavedChangesDialog'
import { importDocx } from './docxImport'
import { exportDocx } from './docxExport'
import { useAppStore } from '../../store/appStore'
import { FontSize } from './extensions/fontSize'
import { PageBreak } from './extensions/pageBreak'
import { ParagraphFormatting } from './extensions/paragraphFormatting'
import { UnderlineWithStyle } from './extensions/underlineExtras'
import { StrikeWithDouble } from './extensions/strikeExtras'
import { CharacterSpacing } from './extensions/characterSpacing'
import { TextEffects } from './extensions/textEffects'
import { DEFAULT_PAGE_SETUP, getPreviewDimensions, type PageSetup } from './pageSetup'
import { DEFAULT_HEADER_FOOTER, type HeaderFooterState } from './headerFooter'
import { DEFAULT_SETTINGS, type AppSettings } from './settings'
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
  const [zoom, setZoom] = useState(100)
  const [findReplaceOpen, setFindReplaceOpen] = useState(false)
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [showFormattingMarks, setShowFormattingMarks] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const loadedPathRef = useRef<string | null>(null)
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
      ParagraphFormatting
    ],
    content: '<p></p>',
    onUpdate: () => setIsDirty(true)
  })

  useEffect(() => {
    window.docfile.getSettings().then(setSettings)
  }, [])

  useEffect(() => {
    if (!editor) return
    editor.view.dom.setAttribute('spellcheck', settings.spellCheck ? 'true' : 'false')
  }, [editor, settings.spellCheck])

  const loadDocument = async (path: string): Promise<void> => {
    if (!editor) return
    loadedPathRef.current = path
    setIsLoading(true)
    setError(null)
    setFileMenuOpen(false)
    try {
      const data = await window.docfile.readFile(path)
      const result = await importDocx(data)
      editor.commands.setContent(result.html)
      setWarnings(result.warnings)
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

      const bytes = await exportDocx(editor.getJSON(), pageSetup, headerFooter)
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

  return (
    <div className="flex h-full flex-col bg-gray-100">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
        <button
          onClick={handleClose}
          className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          title="Back to launcher"
        >
          ← Home
        </button>
        <button
          title="Undo"
          onClick={() => editor?.chain().focus().undo().run()}
          className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
        >
          ↶
        </button>
        <button
          title="Redo"
          onClick={() => editor?.chain().focus().redo().run()}
          className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
        >
          ↷
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
          className="rounded-md bg-office-word px-3 py-1.5 text-sm font-medium text-white hover:bg-office-word/90 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save'}
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
        zoom={zoom}
        onZoomChange={setZoom}
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
          Imported with {warnings.length} formatting note(s) — some advanced Word features may not
          have carried over exactly.
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-8">
        {isLoading ? (
          <div className="text-center text-sm text-gray-500">Opening document…</div>
        ) : (
          <div
            className={`docfile-editor mx-auto max-w-full origin-top ${showFormattingMarks ? 'docfile-show-marks' : ''}`}
            style={{ width: dimensions.widthPx, transform: `scale(${zoom / 100})` }}
          >
            {headerFooter.showHeader && (
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
            <div className="docfile-page">
              <EditorContent
                editor={editor}
                style={{
                  paddingTop: dimensions.paddingTopPx,
                  paddingBottom: dimensions.paddingBottomPx,
                  paddingLeft: dimensions.paddingLeftPx,
                  paddingRight: dimensions.paddingRightPx
                }}
              />
            </div>
            {headerFooter.showFooter && (
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
                  <div className="mt-1 text-center text-xs text-gray-400">Page #</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <StatusBar editor={editor} zoom={zoom} onZoomChange={setZoom} showWordCount={settings.showWordCount} />

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
