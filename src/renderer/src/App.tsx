import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Launcher from './modules/launcher/Launcher'
import WordEditor from './modules/word/WordEditor'
import UpdateBanner from './components/UpdateBanner'

function ActiveScreen(): JSX.Element {
  const view = useAppStore((s) => s.view)

  switch (view.screen) {
    case 'word':
      return <WordEditor filePath={view.filePath} />
    case 'excel':
    case 'powerpoint':
      // Not implemented yet — Phase 2/3 of the plan.
      return <Launcher />
    default:
      return <Launcher />
  }
}

function App(): JSX.Element {
  const refreshRecents = useAppStore((s) => s.refreshRecents)

  useEffect(() => {
    refreshRecents()
  }, [refreshRecents])

  return (
    <>
      <ActiveScreen />
      <UpdateBanner />
    </>
  )
}

export default App
