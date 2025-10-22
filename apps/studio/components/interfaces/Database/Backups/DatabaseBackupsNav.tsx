import Link from 'next/link'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Badge, NavMenu, NavMenuItem } from 'ui'
import { getPathReferences } from 'data/vela/path-references'

type Props = {
  active: 'pitr' | 'scheduled' | 'rtnp'
}

function DatabaseBackupsNav({ active }: Props) {
  const { slug: orgRef, branch: branchRef } = getPathReferences()
  const { ref: projectRef } = useSelectedProjectQuery()?.data || {}

  const navMenuItems = [
    {
      enabled: true,
      id: 'scheduled',
      label: 'Schedule backups',
      href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/backups/scheduled`,
    },
    {
      enabled: true,
      id: 'pitr',
      label: 'Backups',
      href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/backups/pitr`,
    },
    // {
    //   enabled: true,
    //   id: 'rtnp',
    //   label: (
    //     <div className="flex items-center gap-1">
    //       Restore to new project{' '}
    //       <Badge size="small" className="!text-[10px] px-1.5 py-0">
    //         New
    //       </Badge>
    //     </div>
    //   ),
    //   href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/backups/restore-to-new-project`,
    // },
  ] as const

  return (
    <NavMenu className="overflow-hidden overflow-x-auto">
      {navMenuItems.map(
        (item) =>
          item.enabled && (
            <NavMenuItem key={item.id} active={item.id === active}>
              <Link href={item.href}>{item.label}</Link>
            </NavMenuItem>
          )
      )}
    </NavMenu>
  )
}

export default DatabaseBackupsNav
