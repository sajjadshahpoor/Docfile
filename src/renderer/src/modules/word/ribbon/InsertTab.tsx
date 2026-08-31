import type { Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import {
  DocumentAdd20Regular,
  DocumentPageBreak20Regular,
  Table20Regular,
  Image20Regular,
  ShapeUnion20Regular,
  Link20Regular,
  LinkDismiss20Regular,
  Bookmark20Regular,
  Comment20Regular,
  CommentAdd20Regular,
  DocumentHeader20Regular,
  DocumentFooter20Regular,
  NumberSymbol20Regular,
  TextField20Regular,
  CalendarClock20Regular,
  MathFormula20Regular
} from '@fluentui/react-icons'
import { ToolbarButton, BigButton, Group, GroupDivider } from './shared'
import TableMenu from './TableMenu'
import BookmarksDialog from './BookmarksDialog'
import CommentsPanel from './CommentsPanel'
import SymbolDialog from './SymbolDialog'
import { SHAPE_LABELS, shapeToPngDataUrl, type ShapeKind } from '../shapes'
import type { HeaderFooterState } from '../headerFooter'

interface InsertTabProps {
  editor: Editor
  headerFooter: HeaderFooterState
  onHeaderFooterChange: (next: HeaderFooterState) => void
}

function useClickOutside(open: boolean, onClose: () => void): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])
  return ref
}

export default function InsertTab({
  editor,
  headerFooter,
  onHeaderFooterChange
}: InsertTabProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tableMenuOpen, setTableMenuOpen] = useState(false)
  const [shapesMenuOpen, setShapesMenuOpen] = useState(false)
  const [bookmarksOpen, setBookmarksOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [symbolOpen, setSymbolOpen] = useState(false)

  const closeTableMenu = (): void => {
    setTableMenuOpen(false)
    editor.commands.focus()
  }
  const closeShapesMenu = (): void => {
    setShapesMenuOpen(false)
    editor.commands.focus()
  }

  const tableRef = useClickOutside(tableMenuOpen, closeTableMenu)
  const shapesRef = useClickOutside(shapesMenuOpen, closeShapesMenu)

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

  const insertShape = async (kind: ShapeKind): Promise<void> => {
    setShapesMenuOpen(false)
    const src = await shapeToPngDataUrl(kind)
    editor.chain().focus().setImage({ src }).run()
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

  const insertBlankPage = (): void => {
    editor.chain().focus().setPageBreak().insertContent('<p></p>').setPageBreak().run()
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

  const insertTextBox = (): void => {
    editor.chain().focus().setParagraphBorder('all').setShading('#f5f5f5').run()
  }

  const addComment = (): void => {
    if (editor.state.selection.empty) {
      window.alert('Select some text first to comment on it.')
      return
    }
    const text = window.prompt('Comment')
    if (!text) return
    const commentId = `c${Date.now()}${Math.floor(Math.random() * 1000)}`
    editor
      .chain()
      .focus()
      .setMark('comment', {
        commentId,
        author: 'Docfile User',
        text,
        date: new Date().toISOString()
      })
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
      <Group label="Pages">
        <ToolbarButton title="Insert a blank page" icon={DocumentAdd20Regular} onClick={insertBlankPage}>
          Blank Page
        </ToolbarButton>
        <ToolbarButton title="Insert page break" icon={DocumentPageBreak20Regular} onClick={insertPageBreak}>
          Page Break
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Tables">
        <div ref={tableRef} className="relative">
          <BigButton title="Insert table" icon={Table20Regular} label="Table" onClick={() => setTableMenuOpen((v) => !v)} />
          {tableMenuOpen && <TableMenu editor={editor} onClose={closeTableMenu} />}
        </div>
      </Group>

      <GroupDivider />

      <Group label="Illustrations">
        <BigButton title="Insert picture" icon={Image20Regular} label="Pictures" onClick={insertImage} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageSelected}
        />
        <div ref={shapesRef} className="relative">
          <BigButton title="Insert shape" icon={ShapeUnion20Regular} label="Shapes" onClick={() => setShapesMenuOpen((v) => !v)} />
          {shapesMenuOpen && (
            <div className="absolute left-0 top-full z-40 mt-1 w-40 rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
              {(Object.keys(SHAPE_LABELS) as ShapeKind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => insertShape(kind)}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {SHAPE_LABELS[kind]}
                </button>
              ))}
            </div>
          )}
        </div>
      </Group>

      <GroupDivider />

      <Group label="Links">
        <ToolbarButton title="Insert link" icon={Link20Regular} active={editor.isActive('link')} onClick={insertLink}>
          Link
        </ToolbarButton>
        <ToolbarButton title="Remove link" icon={LinkDismiss20Regular} disabled={!editor.isActive('link')} onClick={removeLink} />
        <ToolbarButton title="Bookmark" icon={Bookmark20Regular} onClick={() => setBookmarksOpen(true)}>
          Bookmark
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Comments">
        <BigButton title="Add comment to selection" icon={CommentAdd20Regular} label="Comment" onClick={addComment} />
        <ToolbarButton title="Show all comments" icon={Comment20Regular} onClick={() => setCommentsOpen(true)}>
          Comments…
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Header & Footer">
        <ToolbarButton title="Toggle header" icon={DocumentHeader20Regular} active={headerFooter.showHeader} onClick={toggleHeader}>
          Header
        </ToolbarButton>
        <ToolbarButton title="Toggle footer" icon={DocumentFooter20Regular} active={headerFooter.showFooter} onClick={toggleFooter}>
          Footer
        </ToolbarButton>
        <ToolbarButton title="Insert page number in footer" icon={NumberSymbol20Regular} onClick={insertPageNumber}>
          Page Number
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Text">
        <ToolbarButton title="Insert text box (bordered block)" icon={TextField20Regular} onClick={insertTextBox}>
          Text Box
        </ToolbarButton>
        <ToolbarButton title="Insert date & time" icon={CalendarClock20Regular} onClick={insertDateTime}>
          Date/Time
        </ToolbarButton>
        <ToolbarButton title="Insert symbol" icon={MathFormula20Regular} onClick={() => setSymbolOpen(true)}>
          Symbol
        </ToolbarButton>
      </Group>

      {bookmarksOpen && (
        <BookmarksDialog
          editor={editor}
          onClose={() => {
            setBookmarksOpen(false)
            editor.commands.focus()
          }}
        />
      )}
      {commentsOpen && (
        <CommentsPanel
          editor={editor}
          onClose={() => {
            setCommentsOpen(false)
            editor.commands.focus()
          }}
        />
      )}
      {symbolOpen && (
        <SymbolDialog
          editor={editor}
          onClose={() => {
            setSymbolOpen(false)
            editor.commands.focus()
          }}
        />
      )}
    </div>
  )
}
