import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { PageSetup } from '../pageSetup'
import { buildPrintableHtml } from '../printHtml'

interface ExportPanelProps {
  editor: Editor | null
  pageSetup: PageSetup
  defaultName: string
}

export default function ExportPanel({ editor, pageSetup, defaultName }: ExportPanelProps): JSX.Element {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle')

  const handleExport = async (): Promise<void> => {
    if (!editor) return
    setStatus('exporting')
    try {
      const targetPath = await window.docfile.saveFile('pdf', defaultName.replace(/\.docx$/i, '.pdf'))
      if (!targetPath) {
        setStatus('idle')
        return
      }
      const html = buildPrintableHtml(editor.getHTML(), pageSetup)
      const pdfBytes = await window.docfile.exportPdf(html)
      await window.docfile.writeFile(targetPath, pdfBytes)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Export</h1>
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Create PDF</h2>
      <p className="mb-4 max-w-md text-sm text-gray-500">
        Saves a PDF copy of this document, preserving its layout and formatting.
      </p>
      <button
        onClick={handleExport}
        disabled={status === 'exporting'}
        className="rounded-md bg-office-word px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-office-word/90 disabled:opacity-50"
      >
        {status === 'exporting' ? 'Creating PDF…' : 'Create PDF'}
      </button>
      {status === 'done' && <p className="mt-3 text-sm text-green-700">PDF saved.</p>}
      {status === 'error' && <p className="mt-3 text-sm text-red-700">Couldn't create the PDF.</p>}
    </div>
  )
}
