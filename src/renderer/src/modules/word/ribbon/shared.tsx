import type { ComponentType, ReactNode } from 'react'

export type FluentIcon = ComponentType<{ className?: string }>

// A single small ribbon button — the workhorse of every group. `icon` (a
// Fluent UI icon component, Word's own icon set) is preferred; `children` is
// still accepted for buttons not yet migrated to it, or for compound content
// like a color swatch. Active/selected state uses Fluent's own light-blue
// selection tint rather than a generic Tailwind accent, to match Word.
export function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  icon: Icon,
  children
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  icon?: FluentIcon
  children?: ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 min-w-7 items-center justify-center gap-1 rounded-[3px] px-1.5 text-[13px] font-medium leading-none disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'bg-[#c7e0f4] text-[#185abd]'
          : 'text-[#242424] hover:bg-[#f0f0f0] active:bg-[#e0e0e0]'
      }`}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
    </button>
  )
}

// The large, icon-on-top button used for a group's single most important
// action (Paste, New Comment, etc.) — Word always gives exactly one of
// these pride of place at the left of a group, sized roughly 2 rows tall.
export function BigButton({
  active,
  disabled,
  onClick,
  title,
  icon: Icon,
  label
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  icon: FluentIcon
  label: string
}): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-[60px] w-[52px] flex-col items-center justify-start gap-1 rounded-[3px] px-1 pt-1 text-center text-[11px] font-medium leading-tight disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-[#c7e0f4] text-[#185abd]' : 'text-[#242424] hover:bg-[#f0f0f0] active:bg-[#e0e0e0]'
      }`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <span>{label}</span>
    </button>
  )
}

// A vertical stack of small icon+label rows (Cut/Copy/Format Painter,
// Find/Replace/Select) — Word's other common group sub-layout alongside the
// big button and the 2-row grid.
export function ButtonStack({ children }: { children: ReactNode }): JSX.Element {
  return <div className="flex flex-col items-stretch gap-0.5">{children}</div>
}

export function StackButton({
  active,
  disabled,
  onClick,
  title,
  icon: Icon,
  label
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  icon: FluentIcon
  label: string
}): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-6 items-center gap-1.5 rounded-[3px] px-1.5 text-left text-[13px] leading-none disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-[#c7e0f4] text-[#185abd]' : 'text-[#242424] hover:bg-[#f0f0f0] active:bg-[#e0e0e0]'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  )
}

export function Divider(): JSX.Element {
  return <div className="mx-1 h-6 w-px bg-gray-200" />
}

export function Group({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      <div className="flex flex-1 flex-wrap items-center gap-0.5">{children}</div>
      <div className="text-[11px] text-[#616161]">{label}</div>
    </div>
  )
}

export function GroupDivider(): JSX.Element {
  return <div className="mx-1 h-14 w-px self-stretch bg-gray-200" />
}

// Two stacked rows within a group (Font's name/size row + B/I/U row,
// Paragraph's lists/indent row + align/spacing row).
export function GroupRows({ children }: { children: ReactNode }): JSX.Element {
  return <div className="flex flex-col gap-0.5">{children}</div>
}

export function GroupRow({ children }: { children: ReactNode }): JSX.Element {
  return <div className="flex flex-wrap items-center gap-0.5">{children}</div>
}

// The small diagonal-arrow button in a group's bottom-right corner that
// opens its full dialog (Font, Paragraph) — Word calls this a "dialog
// launcher".
export function DialogLauncher({ title, onClick }: { title: string; onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="ml-0.5 flex h-4 w-4 items-center justify-center self-end text-[#424242] hover:text-office-word"
    >
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M2 10 L10 2 M5 2 H10 V7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
