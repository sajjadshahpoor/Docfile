import type { DocfileApi } from './index'

declare global {
  interface Window {
    docfile: DocfileApi
  }
}
