import type { Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import {
  ClipboardPaste20Regular,
  Copy20Regular,
  Cut20Regular,
  PaintBrush20Regular,
  TextBold20Regular,
  TextItalic20Regular,
  TextUnderline20Regular,
  TextStrikethrough20Regular,
  TextSubscript20Regular,
  TextSuperscript20Regular,
  FontIncrease20Regular,
  FontDecrease20Regular,
  TextCaseLowercase20Regular,
  TextClearFormatting20Regular,
  Highlight20Regular,
  TextColor20Regular,
  TextBulletList20Regular,
  TextNumberListLtr20Regular,
  TextIndentDecrease20Regular,
  TextIndentIncrease20Regular,
  ArrowSort20Regular,
  TextAlignLeft20Regular,
  TextAlignCenter20Regular,
  TextAlignRight20Regular,
  TextAlignJustify20Regular,
  TextLineSpacing20Regular,
  BorderAll20Regular,
  PaintBucket20Regular,
  Search20Regular,
  SelectAllOn20Regular
} from '@fluentui/react-icons'
import { ToolbarButton, BigButton, ButtonStack, StackButton, Group, GroupDivider, GroupRows, GroupRow, DialogLauncher } from './shared'
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
        <div className="flex items-start gap-0.5">
          <div className="flex flex-col items-center">
            <BigButton title="Paste" icon={ClipboardPaste20Regular} label="Paste" onClick={() => document.execCommand('paste')} />
            <select
              title="Paste options"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value === 'plain') pasteAsPlainText()
                e.target.value = ''
              }}
              className="mt-0.5 h-4 w-full rounded border border-gray-200 bg-white text-center text-[10px] text-gray-500"
            >
              <option value="" disabled>
                ▾
              </option>
              <option value="plain">Paste as Plain Text</option>
            </select>
          </div>
          <ButtonStack>
            <StackButton title="Cut" icon={Cut20Regular} label="Cut" onClick={() => document.execCommand('cut')} />
            <StackButton title="Copy" icon={Copy20Regular} label="Copy" onClick={() => document.execCommand('copy')} />
            <StackButton
              title={painting ? 'Painting… click destination text' : 'Format Painter (double-click to keep it on)'}
              icon={PaintBrush20Regular}
              label="Format Painter"
              active={painting}
              onClick={() => (painting ? setPainting(false) : startFormatPainter(false))}
            />
          </ButtonStack>
        </div>
      </Group>

      <GroupDivider />

      <Group label="Font">
        <GroupRows>
          <GroupRow>
            <select
              value={currentFont}
              onChange={(e) => setFontFamily(e.target.value)}
              title="Font"
              className="h-6 w-32 rounded border border-gray-300 bg-white px-1.5 text-[13px] text-gray-800"
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
              className="h-6 w-14 rounded border border-gray-300 bg-white px-1 text-[13px] text-gray-800"
            >
              <option value="default">11</option>
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <ToolbarButton title="Grow font" icon={FontIncrease20Regular} onClick={() => bumpFontSize(1)} />
            <ToolbarButton title="Shrink font" icon={FontDecrease20Regular} onClick={() => bumpFontSize(-1)} />
            <ToolbarButton title="Clear formatting" icon={TextClearFormatting20Regular} onClick={clearFormatting} />
          </GroupRow>

          <GroupRow>
            <ToolbarButton
              title="Bold"
              icon={TextBold20Regular}
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <ToolbarButton
              title="Italic"
              icon={TextItalic20Regular}
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <ToolbarButton
              title="Underline"
              icon={TextUnderline20Regular}
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
            <ToolbarButton
              title="Strikethrough"
              icon={TextStrikethrough20Regular}
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            />
            <ToolbarButton
              title="Subscript"
              icon={TextSubscript20Regular}
              active={editor.isActive('subscript')}
              onClick={() => editor.chain().focus().toggleSubscript().run()}
            />
            <ToolbarButton
              title="Superscript"
              icon={TextSuperscript20Regular}
              active={editor.isActive('superscript')}
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
            />
            <select
              defaultValue=""
              title="Change case"
              onChange={(e) => {
                applyChangeCase(e.target.value as CaseMode)
                e.target.value = ''
              }}
              className="h-6 rounded border border-gray-300 bg-white px-1 text-[13px] text-gray-800"
            >
              <option value="" disabled>
                Aa ▾
              </option>
              <option value="upper">UPPERCASE</option>
              <option value="lower">lowercase</option>
              <option value="title">Capitalize Each Word</option>
              <option value="sentence">Sentence case.</option>
            </select>
            <div className="relative flex h-7 w-6 items-center justify-center rounded hover:bg-[#f0f0f0]">
              <Highlight20Regular className="h-4 w-4" />
              <input
                type="color"
                title="Text highlight color"
                onChange={(e) => setHighlight(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <div className="relative flex h-7 w-6 items-center justify-center rounded hover:bg-[#f0f0f0]">
              <TextColor20Regular className="h-4 w-4" />
              <input
                type="color"
                title="Font color"
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <DialogLauncher title="Font settings" onClick={() => setFontDialogOpen(true)} />
          </GroupRow>
        </GroupRows>
      </Group>

      <GroupDivider />

      <Group label="Paragraph">
        <GroupRows>
          <GroupRow>
            <ToolbarButton
              title="Bullet list"
              icon={TextBulletList20Regular}
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
              title="Numbered list"
              icon={TextNumberListLtr20Regular}
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
            <ToolbarButton
              title="Multilevel list (Tab/Shift+Tab to change levels)"
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1.1
            </ToolbarButton>
            <ToolbarButton title="Decrease indent" icon={TextIndentDecrease20Regular} onClick={() => editor.chain().focus().decreaseIndent().run()} />
            <ToolbarButton title="Increase indent" icon={TextIndentIncrease20Regular} onClick={() => editor.chain().focus().increaseIndent().run()} />
            <ToolbarButton title="Sort A to Z" icon={ArrowSort20Regular} onClick={() => sortSelection(editor, 'asc')} />
            <ToolbarButton title="Sort Z to A" onClick={() => sortSelection(editor, 'desc')}>
              <ArrowSort20Regular className="h-4 w-4 -scale-y-100" />
            </ToolbarButton>
            <ToolbarButton
              title="Show/hide formatting marks"
              active={showFormattingMarks}
              onClick={onToggleFormattingMarks}
            >
              ¶
            </ToolbarButton>
          </GroupRow>
          <GroupRow>
            <ToolbarButton
              title="Align left"
              icon={TextAlignLeft20Regular}
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            />
            <ToolbarButton
              title="Align center"
              icon={TextAlignCenter20Regular}
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            />
            <ToolbarButton
              title="Align right"
              icon={TextAlignRight20Regular}
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            />
            <ToolbarButton
              title="Justify"
              icon={TextAlignJustify20Regular}
              active={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            />
            <div className="flex items-center">
              <TextLineSpacing20Regular className="h-4 w-4" />
              <select
                value={currentLineHeight}
                onChange={(e) => setLineHeight(e.target.value)}
                title="Line spacing"
                className="h-6 w-11 rounded border border-gray-300 bg-white px-0.5 text-[13px] text-gray-800"
              >
                <option value="default">1.0</option>
                <option value="1.15">1.15</option>
                <option value="1.5">1.5</option>
                <option value="2">2.0</option>
              </select>
            </div>
            <div className="flex items-center">
              <BorderAll20Regular className="h-4 w-4" />
              <select
                value={currentBorder}
                onChange={(e) => editor.chain().focus().setParagraphBorder(e.target.value as ParagraphBorder).run()}
                title="Borders"
                className="h-6 w-20 rounded border border-gray-300 bg-white px-0.5 text-[13px] text-gray-800"
              >
                <option value="none">No border</option>
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="relative flex h-7 w-6 items-center justify-center rounded hover:bg-[#f0f0f0]">
              <PaintBucket20Regular className="h-4 w-4" />
              <input
                type="color"
                title="Shading"
                onChange={(e) => editor.chain().focus().setShading(e.target.value).run()}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <DialogLauncher title="Paragraph settings" onClick={() => setParagraphDialogOpen(true)} />
          </GroupRow>
        </GroupRows>
      </Group>

      <GroupDivider />

      <Group label="Styles">
        <div className="flex h-[52px] items-center gap-0.5">
          {(
            [
              ['paragraph', 'Normal', {}],
              ['1', 'Heading 1', { fontWeight: 700, color: '#185abd' }],
              ['2', 'Heading 2', { fontWeight: 700, color: '#2b579a' }],
              ['title', 'Title', { fontWeight: 700, fontSize: '15px' }]
            ] as [string, string, React.CSSProperties][]
          ).map(([value, label, style]) => (
            <button
              key={value}
              type="button"
              title={label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setHeading(value)}
              className={`flex h-[52px] w-16 flex-col items-center justify-center rounded border text-[11px] ${
                currentHeading === value
                  ? 'border-office-word bg-[#c7e0f4] text-[#185abd]'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-office-word/50 hover:bg-gray-50'
              }`}
            >
              <span style={style} className="truncate px-1">
                {label}
              </span>
            </button>
          ))}
          <select
            value={currentHeading}
            onChange={(e) => setHeading(e.target.value)}
            title="More styles"
            className="h-[52px] w-6 self-stretch rounded border border-gray-200 bg-white text-xs text-gray-500"
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
        </div>
      </Group>

      <GroupDivider />

      <Group label="Editing">
        <ButtonStack>
          <StackButton title="Find & Replace" icon={Search20Regular} label="Find" onClick={onToggleFindReplace} />
          <StackButton title="Find & Replace" icon={Search20Regular} label="Replace" onClick={onToggleFindReplace} />
          <StackButton
            title="Select all"
            icon={SelectAllOn20Regular}
            label="Select"
            onClick={() => editor.chain().focus().selectAll().run()}
          />
        </ButtonStack>
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
