import { useEffect, useState } from 'react'
import { COMMON_FONTS } from '../fonts'
import type { AppSettings } from '../settings'

interface OptionsPanelProps {
  onSettingsChange: (settings: AppSettings) => void
}

export default function OptionsPanel({ onSettingsChange }: OptionsPanelProps): JSX.Element {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    window.docfile.getSettings().then(setSettings)
  }, [])

  const update = async (patch: Partial<AppSettings>): Promise<void> => {
    const next = await window.docfile.setSettings(patch)
    setSettings(next)
    onSettingsChange(next)
  }

  if (!settings) return <div />

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Options</h1>

      <div className="max-w-md space-y-6">
        <label className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-800">Check spelling as you type</div>
            <div className="text-xs text-gray-400">Underlines words the system dictionary doesn't recognize.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.spellCheck}
            onChange={(e) => update({ spellCheck: e.target.checked })}
            className="h-5 w-5"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-800">Show word count</div>
            <div className="text-xs text-gray-400">Displays live word/character count in the status bar.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.showWordCount}
            onChange={(e) => update({ showWordCount: e.target.checked })}
            className="h-5 w-5"
          />
        </label>

        <div>
          <div className="mb-1 text-sm font-medium text-gray-800">Default font for new documents</div>
          <select
            value={settings.defaultFont}
            onChange={(e) => update({ defaultFont: e.target.value })}
            className="w-56 rounded border border-gray-300 px-2 py-1.5 text-sm"
            style={{ fontFamily: settings.defaultFont }}
          >
            {COMMON_FONTS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
