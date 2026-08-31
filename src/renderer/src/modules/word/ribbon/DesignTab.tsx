import type { Editor } from '@tiptap/react'
import { Group, GroupDivider } from './shared'
import { applyAccentColorById, applyFontPairById, applySpacingPresetById, applyStyleSet } from '../applyDesign'
import { COLOR_THEMES, FONT_PAIRS, SPACING_PRESETS, STYLE_SETS } from '../designPresets'
import { WATERMARK_PRESETS, type DesignSettings, type PageBorderWeight } from '../design'

interface DesignTabProps {
  editor: Editor
  design: DesignSettings
  onDesignChange: (next: DesignSettings) => void
}

export default function DesignTab({ editor, design, onDesignChange }: DesignTabProps): JSX.Element {
  const setWatermark = (value: string): void => {
    if (value === 'none') {
      onDesignChange({ ...design, watermarkText: null })
      return
    }
    if (value === 'custom') {
      const text = window.prompt('Watermark text', design.watermarkText ?? 'DRAFT')
      if (text) onDesignChange({ ...design, watermarkText: text })
      return
    }
    onDesignChange({ ...design, watermarkText: value })
  }

  const setPageBorder = (pageBorder: PageBorderWeight): void => {
    onDesignChange({ ...design, pageBorder })
  }

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Document Formatting">
        {STYLE_SETS.map((styleSet) => (
          <button
            key={styleSet.id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyStyleSet(editor, styleSet)}
            className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {styleSet.label}
          </button>
        ))}
      </Group>

      <GroupDivider />

      <Group label="Colors">
        {COLOR_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            title={theme.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyAccentColorById(editor, theme.id)}
            className="h-7 w-7 rounded-full border border-gray-300"
            style={{ backgroundColor: theme.accent }}
          />
        ))}
      </Group>

      <GroupDivider />

      <Group label="Fonts">
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) applyFontPairById(editor, e.target.value)
            e.target.value = ''
          }}
          title="Font pair"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="" disabled>
            Choose fonts…
          </option>
          {FONT_PAIRS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </Group>

      <GroupDivider />

      <Group label="Paragraph Spacing">
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) applySpacingPresetById(editor, e.target.value)
            e.target.value = ''
          }}
          title="Paragraph spacing"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="" disabled>
            Choose spacing…
          </option>
          {SPACING_PRESETS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Group>

      <GroupDivider />

      <Group label="Page Background">
        <select
          value={design.watermarkText && WATERMARK_PRESETS.includes(design.watermarkText) ? design.watermarkText : design.watermarkText ? 'custom' : 'none'}
          onChange={(e) => setWatermark(e.target.value)}
          title="Watermark"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="none">No Watermark</option>
          {WATERMARK_PRESETS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
          <option value="custom">Custom Watermark…</option>
        </select>

        <input
          type="color"
          title="Page color"
          value={design.pageColor ?? '#ffffff'}
          onChange={(e) => onDesignChange({ ...design, pageColor: e.target.value })}
          className="h-8 w-8 cursor-pointer rounded border border-gray-300"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onDesignChange({ ...design, pageColor: null })}
          title="Remove page color"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          No Color
        </button>

        <select
          value={design.pageBorder}
          onChange={(e) => setPageBorder(e.target.value as PageBorderWeight)}
          title="Page borders"
          className="h-8 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
        >
          <option value="none">No Border</option>
          <option value="single">Single Border</option>
          <option value="thick">Thick Border</option>
        </select>
        <input
          type="color"
          title="Page border color"
          value={design.pageBorderColor}
          onChange={(e) => onDesignChange({ ...design, pageBorderColor: e.target.value })}
          className="h-8 w-8 cursor-pointer rounded border border-gray-300"
        />
      </Group>
    </div>
  )
}
