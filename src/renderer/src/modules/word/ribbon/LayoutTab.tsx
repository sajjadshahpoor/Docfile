import type { Editor } from '@tiptap/react'
import { Group, GroupDivider } from './shared'
import type { PageSetup, MarginPreset, PageSizeName, Orientation } from '../pageSetup'

interface LayoutTabProps {
  editor: Editor
  pageSetup: PageSetup
  onPageSetupChange: (next: PageSetup) => void
}

export default function LayoutTab({ editor, pageSetup, onPageSetupChange }: LayoutTabProps): JSX.Element {
  const setMargins = (marginPreset: MarginPreset): void => {
    onPageSetupChange({ ...pageSetup, marginPreset })
  }

  const setSize = (size: PageSizeName): void => {
    onPageSetupChange({ ...pageSetup, size })
  }

  const setOrientation = (orientation: Orientation): void => {
    onPageSetupChange({ ...pageSetup, orientation })
  }

  const setSpacing = (before: number | null, after: number | null): void => {
    editor.chain().focus().setParagraphSpacing(before, after).run()
  }

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Margins">
        <select
          value={pageSetup.marginPreset}
          onChange={(e) => setMargins(e.target.value as MarginPreset)}
          title="Margins"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="normal">Normal (1&quot;)</option>
          <option value="narrow">Narrow (0.5&quot;)</option>
          <option value="moderate">Moderate</option>
          <option value="wide">Wide</option>
        </select>
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
          <option value="letter">Letter (8.5x11&quot;)</option>
          <option value="a4">A4 (210x297mm)</option>
          <option value="legal">Legal (8.5x14&quot;)</option>
        </select>
      </Group>

      <GroupDivider />

      <Group label="Paragraph Spacing">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setSpacing(0, 8)}
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Compact
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setSpacing(6, 6)}
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Normal
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setSpacing(12, 12)}
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Relaxed
        </button>
      </Group>
    </div>
  )
}
