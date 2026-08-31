import type { Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { ToolbarButton, Group, GroupDivider } from './shared'
import { COMMON_FONTS, ALL_OFFICE_FONTS } from '../fonts'
import { captureFormatting, applyFormatting, type CapturedFormatting } from '../formatPainter'
import { sortSelection } from '../sortParagraphs'
import type { ParagraphBorder } from '../extensions/paragraphFormatting'
import FontDialog from './FontDialog'
import ParagraphDialog from './ParagraphDialog'

const FONT_SIZES = ['8', '9', '10', '10.5', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72']

type CaseMode = 'upper' | 'lower' | 'title' | 'sentence'

function transformCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase()
    case 'lower':
      return text.toLowerCase()
    case 'title':
      return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    case 'sentence':
      return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
  }
}

interface HomeTabProps {
  editor: Editor
  onToggleFindReplace: () => void
  showFormattingMarks: boolean
  onToggleFormattingMarks: () => void
}

export default function HomeTab({
  editor,
  onToggleFindReplace,
  showFormattingMarks,
  onToggleFormattingMarks
}: HomeTabProps): JSX.Element {
  const [fontDialogOpen, setFontDialogOpen] = useState(false)
  const [paragraphDialogOpen, setParagraphDialogOpen] = useState(false)
  const [painting, setPainting] = useState(false)
  const capturedRef = useRef<CapturedFormatting | null>(null)
  const stickyRef = useRef(false)

  useEffect(() => {
    if (!painting) return
    const dom = editor.view.dom

    const onMouseUp = (): void => {
      const { from, to } = editor.state.selection
      if (capturedRef.current) applyFormatting(editor, capturedRef.current, from, to)
      if (!stickyRef.current) {
        setPainting(false)
        capturedRef.current = null
      }
    }

    dom.addEventListener('mouseup', onMouseUp)
    return () => dom.removeEventListener('mouseup', onMouseUp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [painting])

  const startFormatPainter = (sticky: boolean): void => {
    capturedRef.current = captureFormatting(editor)
    stickyRef.current = sticky
    setPainting(true)
  }

  const setHeading = (value: string): void => {
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run()
    } else if (value === 'quote') {
      editor.chain().focus().toggleBlockquote().run()
    } else if (value === 'title') {
      editor.chain().focus().setParagraph().toggleHeading({ level: 1 }).run()
    } else {
      editor
        .chain()
        .focus()
        .toggleHeading({ level: Number(value) as 1 | 2 | 3 | 4 | 5 | 6 })
        .run()
    }
  }

  const setFontFamily = (value: string): void => {
    if (value === 'default') {
      editor.chain().focus().unsetFontFamily().run()
    } else {
      editor.chain().focus().setFontFamily(value).run()
    }
  }

  const setFontSize = (value: string): void => {
    if (value === 'default') {
      editor.chain().focus().unsetFontSize().run()
    } else {
      editor.chain().focus().setFontSize(`${value}pt`).run()
    }
  }

  const bumpFontSize = (delta: number): void => {
    const current = parseFloat((editor.getAttributes('textStyle').fontSize as string) || '12pt')
    const next = Math.max(1, current + delta)
    editor.chain().focus().setFontSize(`${next}pt`).run()
  }

  const applyChangeCase = (mode: CaseMode): void => {
    const { state, view } = editor
    const { from, to, empty } = state.selection
    if (empty) return
    const tr = state.tr
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText || !node.text) return
      const start = Math.max(pos, from)
      const end = Math.min(pos + node.nodeSize, to)
      if (start >= end) return
      const original = node.text.slice(start - pos, end - pos)
      const transformed = transformCase(original, mode)
      if (transformed !== original) tr.insertText(transformed, start, end)
    })
    view.dispatch(tr)
    editor.commands.focus()
  }

  const clearFormatting = (): void => {
    editor.chain().focus().unsetAllMarks().clearNodes().run()
  }

  const setColor = (color: string): void => {
    editor.chain().focus().setColor(color).run()
  }

  const setHighlight = (color: string): void => {
    editor.chain().focus().setHighlight({ color }).run()
  }

  const setLineHeight = (value: string): void => {
    if (value === 'default') editor.chain().focus().unsetLineHeight().run()
    else editor.chain().focus().setLineHeight(value).run()
  }

  const pasteAsPlainText = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText()
      editor.chain().focus().insertContent(text).run()
    } catch {
      // Clipboard permission denied — nothing we can do without user gesture retry.
    }
  }

  const currentHeading = editor.isActive('blockquote')
    ? 'quote'
    : editor.isActive('heading', { level: 1 })
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

  const currentFont = (editor.getAttributes('textStyle').fontFamily as string) ?? 'default'
  const currentSize = (editor.getAttributes('textStyle').fontSize as string)?.replace('pt', '') ?? 'default'
  const currentLineHeight =
    (editor.getAttributes('paragraph').lineHeight as string) ??
    (editor.getAttributes('heading').lineHeight as string) ??
    'default'
  const currentBorder: ParagraphBorder =
    (editor.getAttributes('paragraph').border as ParagraphBorder) ??
    (editor.getAttributes('heading').border as ParagraphBorder) ??
    'none'

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Clipboard">
        <ToolbarButton title="Cut" onClick={() => document.execCommand('cut')}>
          ✂
        </ToolbarButton>
        <ToolbarButton title="Copy" onClick={() => document.execCommand('copy')}>
          ⧉
        </ToolbarButton>
        <div className="flex items-center gap-0.5">
          <ToolbarButton title="Paste" onClick={() => document.execCommand('paste')}>
            📋
          </ToolbarButton>
          <select
            title="Paste options"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value === 'plain') pasteAsPlainText()
              e.target.value = ''
            }}
            className="h-8 w-6 rounded border border-gray-200 bg-white text-xs text-gray-700"
          >
            <option value="" disabled>
              ▾
            </option>
            <option value="plain">Paste as Plain Text</option>
          </select>
        </div>
        <ToolbarButton
          title={painting ? 'Painting… click destination text' : 'Format Painter (double-click to keep it on)'}
          active={painting}
          onClick={() => (painting ? setPainting(false) : startFormatPainter(false))}
        >
          <span
            onDoubleClick={(e) => {
              e.stopPropagation()
              startFormatPainter(true)
            }}
          >
            🖌
          </span>
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Font">
        <div className="flex flex-wrap items-center gap-1">
          <select
            value={currentFont}
            onChange={(e) => setFontFamily(e.target.value)}
            title="Font"
            className="h-8 w-36 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
            style={{ fontFamily: currentFont === 'default' ? undefined : currentFont }}
          >
            <option value="default">Default</option>
            <optgroup label="Common">
              {COMMON_FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </optgroup>
            <optgroup label="All Office fonts">
              {ALL_OFFICE_FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </optgroup>
          </select>

          <select
            value={currentSize}
            onChange={(e) => setFontSize(e.target.value)}
            title="Font size"
            className="h-8 w-16 rounded border border-gray-200 bg-white px-1 text-sm text-gray-700"
          >
            <option value="default">11</option>
            {FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <ToolbarButton title="Grow font" onClick={() => bumpFontSize(1)}>
            A˄
          </ToolbarButton>
          <ToolbarButton title="Shrink font" onClick={() => bumpFontSize(-1)}>
            A˅
          </ToolbarButton>

          <select
            defaultValue=""
            title="Change case"
            onChange={(e) => {
              applyChangeCase(e.target.value as CaseMode)
              e.target.value = ''
            }}
            className="h-8 rounded border border-gray-200 bg-white px-1 text-sm text-gray-700"
          >
            <option value="" disabled>
              Aa
            </option>
            <option value="upper">UPPERCASE</option>
            <option value="lower">lowercase</option>
            <option value="title">Capitalize Each Word</option>
            <option value="sentence">Sentence case.</option>
          </select>

          <ToolbarButton title="Clear formatting" onClick={clearFormatting}>
            Aø
          </ToolbarButton>

          <ToolbarButton title="Font dialog (more options)" onClick={() => setFontDialogOpen(true)}>
            ⤡
          </ToolbarButton>
        </div>

        <div className="flex flex-wrap items-center gap-1">
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
          <ToolbarButton
            title="Subscript"
            active={editor.isActive('subscript')}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
          >
            X<sub>2</sub>
          </ToolbarButton>
          <ToolbarButton
            title="Superscript"
            active={editor.isActive('superscript')}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          >
            X<sup>2</sup>
          </ToolbarButton>
          <div className="flex flex-col items-center">
            <input
              type="color"
              title="Text highlight color"
              onChange={(e) => setHighlight(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
            />
          </div>
          <input
            type="color"
            title="Font color"
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
          />
        </div>
      </Group>

      <GroupDivider />

      <Group label="Paragraph">
        <div className="flex flex-wrap items-center gap-1">
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
          <ToolbarButton
            title="Multilevel list (Tab/Shift+Tab to change levels)"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1.1
          </ToolbarButton>
          <ToolbarButton title="Decrease indent" onClick={() => editor.chain().focus().decreaseIndent().run()}>
            ⯇⇤
          </ToolbarButton>
          <ToolbarButton title="Increase indent" onClick={() => editor.chain().focus().increaseIndent().run()}>
            ⇥⯈
          </ToolbarButton>
          <ToolbarButton title="Sort A to Z" onClick={() => sortSelection(editor, 'asc')}>
            A→Z
          </ToolbarButton>
          <ToolbarButton title="Sort Z to A" onClick={() => sortSelection(editor, 'desc')}>
            Z→A
          </ToolbarButton>
          <ToolbarButton
            title="Show/hide formatting marks"
            active={showFormattingMarks}
            onClick={onToggleFormattingMarks}
          >
            ¶
          </ToolbarButton>
        </div>
        <div className="flex flex-wrap items-center gap-1">
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
          <select
            value={currentLineHeight}
            onChange={(e) => setLineHeight(e.target.value)}
            title="Line spacing"
            className="h-8 rounded border border-gray-200 bg-white px-1 text-sm text-gray-700"
          >
            <option value="default">1.0</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5</option>
            <option value="2">2.0</option>
          </select>
          <select
            value={currentBorder}
            onChange={(e) => editor.chain().focus().setParagraphBorder(e.target.value as ParagraphBorder).run()}
            title="Borders"
            className="h-8 rounded border border-gray-200 bg-white px-1 text-sm text-gray-700"
          >
            <option value="none">No border</option>
            <option value="bottom">Bottom border</option>
            <option value="top">Top border</option>
            <option value="all">All borders</option>
          </select>
          <input
            type="color"
            title="Shading"
            onChange={(e) => editor.chain().focus().setShading(e.target.value).run()}
            className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
          />
          <ToolbarButton title="Paragraph dialog (indents, spacing)" onClick={() => setParagraphDialogOpen(true)}>
            ⤡
          </ToolbarButton>
        </div>
      </Group>

      <GroupDivider />

      <Group label="Styles">
        <select
          value={currentHeading}
          onChange={(e) => setHeading(e.target.value)}
          title="Styles"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="paragraph">Normal</option>
          <option value="title">Title</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
          <option value="6">Heading 6</option>
          <option value="quote">Quote</option>
        </select>
      </Group>

      <GroupDivider />

      <Group label="Editing">
        <ToolbarButton title="Find & Replace" onClick={onToggleFindReplace}>
          🔍
        </ToolbarButton>
        <ToolbarButton
          title="Select all"
          onClick={() => editor.chain().focus().selectAll().run()}
        >
          Sel
        </ToolbarButton>
      </Group>

      {fontDialogOpen && (
        <FontDialog
          editor={editor}
          onClose={() => {
            setFontDialogOpen(false)
            editor.commands.focus()
          }}
        />
      )}
      {paragraphDialogOpen && (
        <ParagraphDialog
          editor={editor}
          onClose={() => {
            setParagraphDialogOpen(false)
            editor.commands.focus()
          }}
        />
      )}
    </div>
  )
}
