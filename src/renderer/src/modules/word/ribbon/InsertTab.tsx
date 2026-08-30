import type { Editor } from '@tiptap/react'
import { useRef } from 'react'
import { ToolbarButton, Group, GroupDivider } from './shared'
import type { HeaderFooterState } from '../headerFooter'

interface InsertTabProps {
  editor: Editor
  headerFooter: HeaderFooterState
  onHeaderFooterChange: (next: HeaderFooterState) => void
}

export default function InsertTab({
  editor,
  headerFooter,
  onHeaderFooterChange
}: InsertTabProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const insertTable = (): void => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertImage = (): void => {
    fileInputRef.current?.click()
  }

  const onImageSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      editor.chain().focus().setImage({ src }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const insertLink = (): void => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().setLink({ href: url }).run()
  }

  const removeLink = (): void => {
    editor.chain().focus().unsetLink().run()
  }

  const insertPageBreak = (): void => {
    editor.chain().focus().setPageBreak().run()
  }

  const insertDateTime = (): void => {
    const now = new Date()
    editor
      .chain()
      .focus()
      .insertContent(
        now.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
      )
      .run()
  }

  const toggleHeader = (): void => {
    onHeaderFooterChange({ ...headerFooter, showHeader: !headerFooter.showHeader })
  }

  const toggleFooter = (): void => {
    onHeaderFooterChange({ ...headerFooter, showFooter: !headerFooter.showFooter })
  }

  const insertPageNumber = (): void => {
    onHeaderFooterChange({ ...headerFooter, showFooter: true, includePageNumber: true })
  }

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Tables">
        <ToolbarButton title="Insert table (3x3)" onClick={insertTable}>
          ⊞ Table
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Illustrations">
        <ToolbarButton title="Insert picture" onClick={insertImage}>
          🖼 Picture
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageSelected}
        />
      </Group>

      <GroupDivider />

      <Group label="Links">
        <ToolbarButton title="Insert link" active={editor.isActive('link')} onClick={insertLink}>
          🔗 Link
        </ToolbarButton>
        <ToolbarButton title="Remove link" disabled={!editor.isActive('link')} onClick={removeLink}>
          🔗✕
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Header & Footer">
        <ToolbarButton title="Toggle header" active={headerFooter.showHeader} onClick={toggleHeader}>
          Header
        </ToolbarButton>
        <ToolbarButton title="Toggle footer" active={headerFooter.showFooter} onClick={toggleFooter}>
          Footer
        </ToolbarButton>
        <ToolbarButton title="Insert page number in footer" onClick={insertPageNumber}>
          # Page Number
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Text">
        <ToolbarButton title="Insert page break" onClick={insertPageBreak}>
          ⤓ Page Break
        </ToolbarButton>
        <ToolbarButton title="Insert date & time" onClick={insertDateTime}>
          🕐 Date/Time
        </ToolbarButton>
      </Group>
    </div>
  )
}
