interface RulerProps {
  widthPx: number
  marginLeftPx: number
  marginRightPx: number
}

const PX_PER_INCH = 96

// A static (non-draggable) ruler showing inch ticks and the current margins
// — Word's own ruler lets you drag margin/tab markers directly; that needs
// its own drag-to-pageSetup wiring this doesn't attempt, so this is a
// read-only reference matching the Home > Layout margin values instead.
export default function Ruler({ widthPx, marginLeftPx, marginRightPx }: RulerProps): JSX.Element {
  const inches = Math.ceil(widthPx / PX_PER_INCH)

  return (
    <div
      className="relative mx-auto h-6 select-none overflow-hidden rounded-sm border border-gray-300 bg-gray-400 shadow-sm"
      style={{ width: widthPx }}
    >
      <div
        className="absolute inset-y-0 bg-white"
        style={{ left: marginLeftPx, right: marginRightPx }}
      />
      {Array.from({ length: inches + 1 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 h-full border-l border-gray-600 text-[9px] font-medium text-gray-700"
          style={{ left: i * PX_PER_INCH }}
        >
          <span className="ml-0.5">{i > 0 ? i : ''}</span>
        </div>
      ))}
    </div>
  )
}
