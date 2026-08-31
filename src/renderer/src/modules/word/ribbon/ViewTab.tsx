import { Group, GroupDivider, ToolbarButton } from './shared'
import type { ViewMode, ViewSettings } from '../viewSettings'

interface ViewTabProps {
  view: ViewSettings
  onViewChange: (next: ViewSettings) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onFitPageWidth: () => void
}

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'print', label: 'Print Layout' },
  { id: 'web', label: 'Web Layout' },
  { id: 'draft', label: 'Draft' },
  { id: 'read', label: 'Read Mode' }
]

export default function ViewTab({ view, onViewChange, zoom, onZoomChange, onFitPageWidth }: ViewTabProps): JSX.Element {
  const setMode = (mode: ViewMode): void => onViewChange({ ...view, mode })

  return (
    <div className="flex flex-wrap items-start">
      <Group label="Views">
        {VIEW_MODES.map((m) => (
          <ToolbarButton key={m.id} title={m.label} active={view.mode === m.id} onClick={() => setMode(m.id)}>
            {m.label}
          </ToolbarButton>
        ))}
      </Group>

      <GroupDivider />

      <Group label="Show">
        <ToolbarButton
          title="Ruler"
          active={view.showRuler}
          disabled={view.mode === 'draft' || view.mode === 'read'}
          onClick={() => onViewChange({ ...view, showRuler: !view.showRuler })}
        >
          Ruler
        </ToolbarButton>
        <ToolbarButton
          title="Gridlines"
          active={view.showGridlines}
          disabled={view.mode === 'read'}
          onClick={() => onViewChange({ ...view, showGridlines: !view.showGridlines })}
        >
          Gridlines
        </ToolbarButton>
        <ToolbarButton
          title="Navigation Pane"
          active={view.showNavPane}
          disabled={view.mode === 'read'}
          onClick={() => onViewChange({ ...view, showNavPane: !view.showNavPane })}
        >
          Navigation Pane
        </ToolbarButton>
      </Group>

      <GroupDivider />

      <Group label="Zoom">
        <ToolbarButton title="Zoom out" onClick={() => onZoomChange(Math.max(50, zoom - 10))}>
          −
        </ToolbarButton>
        <span className="w-12 text-center text-sm text-gray-700">{zoom}%</span>
        <ToolbarButton title="Zoom in" onClick={() => onZoomChange(Math.min(200, zoom + 10))}>
          +
        </ToolbarButton>
        <ToolbarButton title="Reset zoom to 100%" onClick={() => onZoomChange(100)}>
          100%
        </ToolbarButton>
        <ToolbarButton title="Page Width — fit the page to the window" onClick={onFitPageWidth}>
          Page Width
        </ToolbarButton>
      </Group>
    </div>
  )
}
