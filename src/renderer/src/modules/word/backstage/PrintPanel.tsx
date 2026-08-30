import type { Editor } from '@tiptap/react'
import type { PageSetup } from '../pageSetup'
import { buildPrintableHtml } from '../printHtml'

interface PrintPanelProps {
  editor: Editor | null
  pageSetup: PageSetup
}

export default function PrintPanel({ editor, pageSetup }: PrintPanelProps): JSX.Element {
  const html = editor?.getHTML() ?? '<p></p>'

  const handlePrint = (): void => {
    window.docfile.printDocument(buildPrintableHtml(html, pageSetup))
  }

  return (
    <div className="flex gap-10">
      <div className="w-56 shrink-0">
        <h1 className="mb-6 text-2xl font-semibold text-gray-800">Print</h1>
        <button
          onClick={handlePrint}
          className="w-full rounded-md bg-office-word px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-office-word/90"
        >
          🖶 Print
        </button>
        <p className="mt-3 text-xs text-gray-400">
          Opens your computer's print dialog, where you can choose a printer, page range, and
          copies.
        </p>
      </div>

      <div className="flex-1 overflow-auto rounded border border-gray-200 bg-gray-100 p-6">
        <div
          className="docfile-editor mx-auto w-[700px] max-w-full origin-top"
          style={{ transform: 'scale(0.85)' }}
        >
          <div className="docfile-page px-16 py-12">
            <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>
    </div>
  )
}
