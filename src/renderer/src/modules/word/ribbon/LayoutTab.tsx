import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Group, GroupDivider } from './shared'
import MarginsDialog from './MarginsDialog'
import {
  PAGE_SIZE_LABELS,
  type ColumnCount,
  type CustomMargins,
  type Hyphenation,
  type LineNumbering,
  type MarginPreset,
  type PageSetup,
  type PageSizeName,
  type Orientation
} from '../pageSetup'

interface LayoutTabProps {
  editor: Editor
  pageSetup: PageSetup
  onPageSetupChange: (next: PageSetup) => void
}

function currentBlockAttrs(editor: Editor): Record<string, unknown> {
  return editor.isActive('heading') ? editor.getAttributes('heading') : editor.getAttributes('paragraph')
}

export default function LayoutTab({ editor, pageSetup, onPageSetupChange }: LayoutTabProps): JSX.Element {
  const [marginsDialogOpen, setMarginsDialogOpen] = useState(false)
  const attrs = currentBlockAttrs(editor)
  const indentLeft = Number(attrs.indentLeft ?? 0)
  const indentRight = Number(attrs.indentRight ?? 0)
  const spacingBefore = Number(attrs.spacingBefore ?? 0)
  const spacingAfter = Number(attrs.spacingAfter ?? 0)

  const setMarginPreset = (marginPreset: MarginPreset): void => {
    if (marginPreset === 'custom') {
      setMarginsDialogOpen(true)
      return
    }
    onPageSetupChange({ ...pageSetup, marginPreset })
  }

  const applyCustomMargins = (customMargins: CustomMargins): void => {
    onPageSetupChange({ ...pageSetup, marginPreset: 'custom', customMargins })
  }

  const setSize = (size: PageSizeName): void => {
    onPageSetupChange({ ...pageSetup, size })
  }

  const setOrientation = (orientation: Orientation): void => {
    onPageSetupChange({ ...pageSetup, orientation })
  }

  const setColumns = (columns: ColumnCount): void => {
    onPageSetupChange({ ...pageSetup, columns })
  }

  const setLineNumbering = (lineNumbering: LineNumbering): void => {
    onPageSetupChange({ ...pageSetup, lineNumbering })
  }

  const setHyphenation = (hyphenation: Hyphenation): void => {
    onPageSetupChange({ ...pageSetup, hyphenation })
  }

  const insertPageBreak = (): void => {
    editor.chain().focus().setPageBreak().run()
  }

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Margins">
        <select
          value={pageSetup.marginPreset}
          onChange={(e) => setMarginPreset(e.target.value as MarginPreset)}
          title="Margins"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="normal">Normal (1&quot;)</option>
          <option value="narrow">Narrow (0.5&quot;)</option>
          <option value="moderate">Moderate</option>
          <option value="wide">Wide</option>
          <option value="custom">Custom</option>
        </select>
        {pageSetup.marginPreset === 'custom' && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMarginsDialogOpen(true)}
            title="Edit custom margins"
            className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit…
          </button>
        )}
      </Group>

      <GroupDivider />

      <Group label="Orientation">
        <select
          value={pageSetup.orientation}
          onChange={(e) => setOrientation(e.target.value as Orientation)}
          title="Orientation"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </Group>

      <GroupDivider />

      <Group label="Size">
        <select
          value={pageSetup.size}
          onChange={(e) => setSize(e.target.value as PageSizeName)}
          title="Page size"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          {(Object.keys(PAGE_SIZE_LABELS) as PageSizeName[]).map((size) => (
            <option key={size} value={size}>
              {PAGE_SIZE_LABELS[size]}
            </option>
          ))}
        </select>
      </Group>

      <GroupDivider />

      <Group label="Columns">
        <select
          value={pageSetup.columns}
          onChange={(e) => setColumns(Number(e.target.value) as ColumnCount)}
          title="Columns"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value={1}>One</option>
          <option value={2}>Two</option>
          <option value={3}>Three</option>
        </select>
      </Group>

      <GroupDivider />

      <Group label="Breaks">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertPageBreak}
          title="Insert a page break"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Page Break
        </button>
      </Group>

      <GroupDivider />

      <Group label="Line Numbers">
        <select
          value={pageSetup.lineNumbering}
          onChange={(e) => setLineNumbering(e.target.value as LineNumbering)}
          title="Line numbers"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="none">None</option>
          <option value="continuous">Continuous</option>
        </select>
      </Group>

      <GroupDivider />

      <Group label="Hyphenation">
        <select
          value={pageSetup.hyphenation}
          onChange={(e) => setHyphenation(e.target.value as Hyphenation)}
          title="Hyphenation"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="none">None</option>
          <option value="auto">Automatic</option>
        </select>
      </Group>

      <GroupDivider />

      <Group label="Paragraph">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Left</span>
          <input
            type="number"
            min={0}
            max={6}
            step={0.1}
            value={indentLeft}
            title="Indent left (in.)"
            onChange={(e) => editor.chain().focus().setIndentLeft(parseFloat(e.target.value) || 0).run()}
            className="h-8 w-16 rounded border border-gray-200 bg-white px-1.5 text-sm text-gray-700"
          />
          <span className="text-xs text-gray-500">Right</span>
          <input
            type="number"
            min={0}
            max={6}
            step={0.1}
            value={indentRight}
            title="Indent right (in.)"
            onChange={(e) => editor.chain().focus().setIndentRight(parseFloat(e.target.value) || 0).run()}
            className="h-8 w-16 rounded border border-gray-200 bg-white px-1.5 text-sm text-gray-700"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Before</span>
          <input
            type="number"
            min={0}
            step={1}
            value={spacingBefore}
            title="Space before (pt)"
            onChange={(e) =>
              editor.chain().focus().setParagraphSpacing(Number(e.target.value), null).run()
            }
            className="h-8 w-14 rounded border border-gray-200 bg-white px-1.5 text-sm text-gray-700"
          />
          <span className="text-xs text-gray-500">After</span>
          <input
            type="number"
            min={0}
            step={1}
            value={spacingAfter}
            title="Space after (pt)"
            onChange={(e) =>
              editor.chain().focus().setParagraphSpacing(null, Number(e.target.value)).run()
            }
            className="h-8 w-14 rounded border border-gray-200 bg-white px-1.5 text-sm text-gray-700"
          />
        </div>
      </Group>

      {marginsDialogOpen && (
        <MarginsDialog
          pageSetup={pageSetup}
          onApply={applyCustomMargins}
          onClose={() => setMarginsDialogOpen(false)}
        />
      )}
    </div>
  )
}
