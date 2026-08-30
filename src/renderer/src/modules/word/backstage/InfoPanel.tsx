import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { PageSetup } from '../pageSetup'

interface InfoPanelProps {
  editor: Editor | null
  currentPath: string | null
  pageSetup: PageSetup
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function InfoPanel({ editor, currentPath, pageSetup }: InfoPanelProps): JSX.Element {
  const [stat, setStat] = useState<{ size: number; mtimeMs: number } | null>(null)

  useEffect(() => {
    if (!currentPath) {
      setStat(null)
      return
    }
    window.docfile.statFile(currentPath).then(setStat)
  }, [currentPath])

  const words = editor?.storage.characterCount?.words() ?? 0
  const characters = editor?.storage.characterCount?.characters() ?? 0

  const rows: [string, string][] = [
    ['File name', currentPath ? currentPath.split(/[\\/]/).pop()! : 'Not saved yet'],
    ['Location', currentPath ?? '—'],
    ['Size', stat ? formatBytes(stat.size) : '—'],
    ['Last modified', stat ? new Date(stat.mtimeMs).toLocaleString() : '—'],
    ['Words', String(words)],
    ['Characters', String(characters)],
    ['Page size', `${pageSetup.size.toUpperCase()} · ${pageSetup.orientation}`],
    ['Margins', pageSetup.marginPreset]
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Info</h1>
      <div className="max-w-xl divide-y divide-gray-100 rounded-lg border border-gray-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="max-w-xs truncate text-gray-800" title={value}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
