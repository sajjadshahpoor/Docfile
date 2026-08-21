import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useEffect, useRef, useState } from 'react'
import Toolbar from './Toolbar'
import { importDocx } from './docxImport'
import { exportDocx } from './docxExport'
import { useAppStore } from '../../store/appStore'

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

  const [currentPath, setCurrentPath] = useState<string | null>(filePath)
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(!!filePath)
  const [isSaving, setIsSaving] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const loadedPathRef = useRef<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: '<p></p>',
    onUpdate: () => setIsDirty(true)
  })

  useEffect(() => {
    if (!editor) return
    if (!filePath || loadedPathRef.current === filePath) return

    loadedPathRef.current = filePath
    setIsLoading(true)
    setError(null)

    window.docfile
      .readFile(filePath)
      .then((data) => importDocx(data))
      .then((result) => {
        editor.commands.setContent(result.html)
        setWarnings(result.warnings)
        setIsDirty(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to open document')
      })
      .finally(() => setIsLoading(false))
  }, [editor, filePath])

  const handleSave = async (forcePicker = false): Promise<void> => {
    if (!editor) return
    setIsSaving(true)
    setError(null)
    try {
      let targetPath = currentPath
      if (forcePicker || !targetPath) {
        const picked = await window.docfile.saveFile('word', targetPath ?? 'Untitled.docx')
        if (!picked) return
        targetPath = picked
      }

      const bytes = await exportDocx(editor.getJSON())
      await window.docfile.writeFile(targetPath, bytes)
      setCurrentPath(targetPath)
      setIsDirty(false)

      await window.docfile.addRecent({
        path: targetPath,
        name: fileNameFromPath(targetPath),
        module: 'word'
      })
      refreshRecents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-gray-100">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
        <button
          onClick={goToLauncher}
          className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          title="Back to launcher"
        >
          ← Home
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

      <Toolbar editor={editor} />

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
          <div className="docfile-editor mx-auto w-[850px] max-w-full">
            <div className="docfile-page">
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
