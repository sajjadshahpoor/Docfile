export type CitationStyle = 'apa' | 'mla' | 'chicago'
export type SourceType = 'book' | 'website' | 'article'

export interface Source {
  id: string
  type: SourceType
  author: string
  title: string
  year: string
  publisher: string
  url: string
}

export const DEFAULT_CITATION_STYLE: CitationStyle = 'apa'

export function newSource(): Source {
  return {
    id: `s${Date.now()}${Math.floor(Math.random() * 1000)}`,
    type: 'book',
    author: '',
    title: '',
    year: '',
    publisher: '',
    url: ''
  }
}

function lastName(author: string): string {
  const trimmed = author.trim()
  if (!trimmed) return 'Unknown'
  // "Last, First" is the standard way citation managers expect authors to be
  // entered (Zotero, EndNote, etc.) — prefer that reading over just "First
  // Last", since the same string ("Smith, John") would otherwise resolve to
  // the wrong name (the given name) if only the last whitespace-separated
  // token were taken.
  if (trimmed.includes(',')) return trimmed.split(',')[0].trim()
  const parts = trimmed.split(/\s+/)
  return parts[parts.length - 1]
}

// Formats a source as it appears inline at the point of use — not a
// citation-manager-grade implementation of any style guide, just enough to
// look right for the common case (one author, no page numbers).
export function formatInTextCitation(source: Source, style: CitationStyle): string {
  const year = source.year || 'n.d.'
  switch (style) {
    case 'apa':
      return `(${lastName(source.author)}, ${year})`
    case 'mla':
      return `(${lastName(source.author)})`
    case 'chicago':
      return `(${lastName(source.author)} ${year})`
  }
}

// Formats a source as a full bibliography/works-cited entry.
export function formatBibliographyEntry(source: Source, style: CitationStyle): string {
  const author = source.author.trim() || 'Unknown'
  const title = source.title.trim() || 'Untitled'
  const year = source.year || 'n.d.'

  switch (style) {
    case 'apa': {
      const tail =
        source.type === 'website'
          ? source.url
          : [source.publisher, source.url].filter(Boolean).join('. ')
      return `${author} (${year}). ${title}.${tail ? ` ${tail}` : ''}`
    }
    case 'mla': {
      const tail =
        source.type === 'website'
          ? source.url
          : [source.publisher, year].filter(Boolean).join(', ')
      return `${author}. "${title}." ${tail}.`
    }
    case 'chicago': {
      const tail =
        source.type === 'website'
          ? source.url
          : [source.publisher, year].filter(Boolean).join(', ')
      return `${author}. ${title}. ${tail}.`
    }
  }
}

export function sortSourcesForBibliography(sources: Source[]): Source[] {
  return [...sources].sort((a, b) => lastName(a.author).localeCompare(lastName(b.author)))
}
