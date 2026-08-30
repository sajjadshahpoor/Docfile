import { ToolbarButton, Group } from './shared'

interface ViewTabProps {
  zoom: number
  onZoomChange: (zoom: number) => void
}

export default function ViewTab({ zoom, onZoomChange }: ViewTabProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-start">
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
      </Group>
    </div>
  )
}
