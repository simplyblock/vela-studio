import { Copy } from 'lucide-react'

import CopyButton from 'components/ui/CopyButton'
import { User } from 'data/auth/users-infinite-query'
import { cn } from 'ui'
import { PANEL_PADDING } from './Users.constants'
import { getDisplayName } from './Users.utils'

export const UserHeader = ({ user }: { user: User }) => {
  const displayName = getDisplayName(user)
  const hasDisplayName = displayName !== '-'

  return (
    <div className={cn(PANEL_PADDING)}>
      {hasDisplayName && <p>{displayName}</p>}
      <div className="flex items-center gap-x-1">
        <p className={cn(hasDisplayName ? 'text-foreground-light text-sm' : 'text-foreground')}>
          {user.email}
        </p>
        <CopyButton
          iconOnly
          type="text"
          icon={<Copy />}
          className="px-1"
          text={user?.email ?? ''}
        />
      </div>
    </div>
  )
}
