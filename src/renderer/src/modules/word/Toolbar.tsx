import type { Editor } from '@tiptap/react'
import { useRef } from 'react'

interface ToolbarProps {
  editor: Editor | null
}

function ToolbarButton({
  active,
  onClick,
  title,
  children
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm font-medium ${
        active ? 'bg-office-word/10 text-office-word' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

function Divider(): JSX.Element {
  return <div className="mx-1 h-6 w-px bg-gray-200" />
}

export default function Toolbar({ editor }: ToolbarProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!editor) return <div className="h-12 border-b border-gray-200 bg-white" />

  const setHeading = (value: string): void => {
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run()
    } else {
      editor
        .chain()
        .focus()
        .toggleHeading({ level: Number(value) as 1 | 2 | 3 | 4 | 5 | 6 })
        .run()
    }
  }

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

  const setColor = (color: string): void => {
    editor.chain().focus().setColor(color).run()
  }

  const setHighlight = (color: string): void => {
    editor.chain().focus().toggleHighlight({ color }).run()
  }

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? '1'
    : editor.isActive('heading', { level: 2 })
      ? '2'
      : editor.isActive('heading', { level: 3 })
        ? '3'
        : editor.isActive('heading', { level: 4 })
          ? '4'
          : editor.isActive('heading', { level: 5 })
            ? '5'
            : editor.isActive('heading', { level: 6 })
              ? '6'
              : 'paragraph'

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-3 py-1.5">
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolbarButton>

      <Divider />

      <select
        value={currentHeading}
        onChange={(e) => setHeading(e.target.value)}
        className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
      >
        <option value="paragraph">Normal</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
        <option value="5">Heading 5</option>
        <option value="6">Heading 6</option>
      </select>

      <Divider />

      <ToolbarButton
        title="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <b>B</b>
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i>I</i>
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <u>U</u>
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </ToolbarButton>

      <Divider />

      <input
        type="color"
        title="Text color"
        onChange={(e) => setColor(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
      />
      <ToolbarButton
        title="Highlight"
        active={editor.isActive('highlight')}
        onClick={() => setHighlight('yellow')}
      >
        <span className="bg-yellow-200 px-1">H</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Align left"
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        ⯇≡
      </ToolbarButton>
      <ToolbarButton
        title="Align center"
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        ≡
      </ToolbarButton>
      <ToolbarButton
        title="Align right"
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        ≡⯈
      </ToolbarButton>
      <ToolbarButton
        title="Justify"
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        ☰
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • ≡
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. ≡
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Insert table" onClick={insertTable}>
        ⊞
      </ToolbarButton>
      <ToolbarButton title="Insert image" onClick={insertImage}>
        🖼
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onImageSelected}
      />
    </div>
  )
}
