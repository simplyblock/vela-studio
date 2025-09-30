import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'

export const generateBranchMenu = (slug: string, ref: string): ProductMenuGroup[] => {
  return [
    {
      title: 'Manage',
      items: [
        {
          name: 'Branches',
          key: 'branches',
          url: `/org/${slug}/project/${ref}/branch`,
          items: [],
        }
      ],
    },
  ]
}
