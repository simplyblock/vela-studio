import { Book, Github } from 'lucide-react'

import {
  DocsSearchResultType as PageType,
  type DocsSearchResult as Page,
  type DocsSearchResultSection as PageSection,
} from 'common'

export function getPageIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <Book strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <Github strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function generateLink(pageType: PageType, link: string): string {
  switch (pageType) {
    case PageType.Markdown:
    case PageType.Reference:
      return `https://vela.run/docs${link}`
    case PageType.Integration:
      return `https://vela.run${link}`
    case PageType.GithubDiscussion:
      return link
    default:
      throw new Error(`Unknown page type '${pageType}'`)
  }
}

export function formatSectionUrl(page: Page, section: PageSection): string {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.GithubDiscussion:
      return `${generateLink(page.type, page.path)}#${section.slug ?? ''}`
    case PageType.Reference:
      return `${generateLink(page.type, page.path)}/${section.slug ?? ''}`
    case PageType.Integration:
      return generateLink(page.type, page.path) // Assuming no section slug for Integration pages
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}
