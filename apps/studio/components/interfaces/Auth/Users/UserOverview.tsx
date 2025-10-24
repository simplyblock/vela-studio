import dayjs from 'dayjs'
import { Ban, Check, Copy, ShieldOff, Trash, X } from 'lucide-react'
import { ComponentProps, ReactNode, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import CopyButton from 'components/ui/CopyButton'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useUserProvidersQuery } from 'data/auth/user-providers-query'
import { useUserDeleteMFAFactorsMutation } from 'data/auth/user-delete-mfa-factors-mutation'
import { useUserResetPasswordMutation } from 'data/auth/user-reset-password-mutation'
import { useUserSendMagicLinkMutation } from 'data/auth/user-send-magic-link-mutation'
import { useUserUpdateMutation } from 'data/auth/user-update-mutation'
import { User } from 'data/auth/users-infinite-query'
import { timeout } from 'lib/helpers'
import { Button, cn, Separator } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { BanUserModal } from './BanUserModal'
import { DeleteUserModal } from './DeleteUserModal'
import { UserHeader } from './UserHeader'
import { PANEL_PADDING } from './Users.constants'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'
import { useAuthUserSessions } from 'data/auth/auth-user-sessions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const DATE_FORMAT = 'DD MMM, YYYY HH:mm'
const CONTAINER_CLASS = cn(
  'bg-surface-100 border-default text-foreground flex items-center justify-between',
  'gap-x-4 border px-5 py-4 text-sm first:rounded-tr first:rounded-tl last:rounded-br last:rounded-bl'
)

interface UserOverviewProps {
  user: User
  onDeleteSuccess: () => void
}

export const UserOverview = ({ user, onDeleteSuccess }: UserOverviewProps) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { data: branch } = useSelectedBranchQuery()
  const isEmailAuth = user.email !== null
  const isBanned = !user.enabled

  const { data: userProviders, isLoading: isLoadingProviders } = useUserProvidersQuery({
    orgId: branch?.organization_id,
    projectId: branch?.project_id,
    branchId: branch?.id,
    userId: user.id,
  })
  console.log(userProviders, typeof userProviders)

  const { data: userSessions, isLoading: isLoadingSessions } = useAuthUserSessions({
    branch,
    userId: user.id,
  })

  const lastSessionAt = useMemo(() => {
    if (isLoadingSessions) return undefined
    if (userSessions === undefined) return undefined
    if (userSessions.length === 0) return undefined
    return userSessions.reduce((prev: number | undefined, curr) => {
      if (prev === undefined) return curr.lastAccess
      if (curr.lastAccess === undefined) return prev
      return prev > curr.lastAccess ? prev : curr.lastAccess
    }, undefined)
  }, [userSessions, isLoadingSessions])

  const { can: canUpdateUser } = useCheckPermissions("branch:auth:admin")
  const { can: canSendMagicLink } = useCheckPermissions("branch:auth:admin")
  const { can: canSendRecovery } = useCheckPermissions("branch:auth:admin")
  const { can: canSendOtp } = useCheckPermissions("branch:auth:admin")
  const { can: canRemoveUser } = useCheckPermissions("branch:auth:admin")
  const { can: canRemoveMFAFactors } = useCheckPermissions("branch:auth:admin")

  const [successAction, setSuccessAction] = useState<
    'send_magic_link' | 'send_recovery' | 'send_otp'
  >()
  const [isBanModalOpen, setIsBanModalOpen] = useState(false)
  const [isUnbanModalOpen, setIsUnbanModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleteFactorsModalOpen, setIsDeleteFactorsModalOpen] = useState(false)

  const { data } = useAuthConfigQuery({ projectRef })

  const mailerOtpExpiry = data?.MAILER_OTP_EXP ?? 0
  const minutes = Math.floor(mailerOtpExpiry / 60)
  const seconds = Math.floor(mailerOtpExpiry % 60)
  const formattedExpiry = `${mailerOtpExpiry > 60 ? `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds > 0 ? 'and' : ''} ` : ''}${seconds > 0 ? `${seconds} second${seconds > 1 ? 's' : ''}` : ''}`

  const { mutate: resetPassword, isLoading: isResettingPassword } = useUserResetPasswordMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_recovery')
      toast.success(`Sent password recovery to ${vars.user.email}`)
    },
    onError: (err) => {
      toast.error(`Failed to send password recovery: ${err.message}`)
    },
  })
  const { mutate: sendMagicLink, isLoading: isSendingMagicLink } = useUserSendMagicLinkMutation({
    onSuccess: (_, vars) => {
      setSuccessAction('send_magic_link')
      toast.success(`Sent magic link to ${vars.user.email}`)
    },
    onError: (err) => {
      toast.error(`Failed to send magic link: ${err.message}`)
    },
  })
  const { mutate: deleteUserMFAFactors } = useUserDeleteMFAFactorsMutation({
    onSuccess: () => {
      toast.success("Successfully deleted the user's factors")
      setIsDeleteFactorsModalOpen(false)
    },
  })
  const { mutate: updateUser, isLoading: isUpdatingUser } = useUserUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully unbanned user')
      setIsUnbanModalOpen(false)
    },
  })

  const handleDeleteFactors = async () => {
    await timeout(200)
    if ((branch?.organization_id === undefined) || (branch?.project_id === undefined) || (branch?.id === undefined)) {
      return console.error('Branch is required')
    }
    deleteUserMFAFactors({
      organization_id: branch.organization_id!,
      project_id: branch.project_id!,
      branch_id: branch.id!,
      user_id: user.id,
    })
  }

  const handleUnban = () => {
    if (
      branch?.organization_id === undefined ||
      branch?.project_id === undefined ||
      branch?.id === undefined
    ) {
      return console.error('Branch is required')
    }
    if (user.id === undefined) {
      return toast.error(`Failed to ban user: User ID not found`)
    }

    updateUser({
      organization_id: branch.organization_id!,
      project_id: branch.project_id!,
      branch_id: branch.id!,
      user_id: user.id,
      enabled: true,
    })
  }

  useEffect(() => {
    if (successAction !== undefined) {
      const timer = setTimeout(() => setSuccessAction(undefined), 5000)
      return () => clearTimeout(timer)
    }
  }, [successAction])

  return (
    <>
      <div>
        <UserHeader user={user} />

        {isBanned ? (
          <Admonition
            type="warning"
            label={'User is currently banned'}
            className="border-r-0 border-l-0 rounded-none -mt-px [&_svg]:ml-0.5 mb-0"
          />
        ) : (
          <Separator />
        )}

        <div className={cn('flex flex-col gap-y-1', PANEL_PADDING)}>
          <RowData property="User UID" value={user.id} />
          <RowData
            property="Created at"
            value={
              user.createdTimestamp
                ? dayjs(new Date(user.createdTimestamp)).format(DATE_FORMAT)
                : undefined
            }
          />
          <RowData
            property="Last signed in"
            value={lastSessionAt ? dayjs(new Date(lastSessionAt)).format(DATE_FORMAT) : undefined}
          />
        </div>

        <div className={cn('flex flex-col !pt-0', PANEL_PADDING)}>
          <p>Provider Information</p>
          <p className="text-sm text-foreground-light">The user has the following providers</p>
        </div>

        <div className={cn('flex flex-col -space-y-1 !pt-0', PANEL_PADDING)}>
          {isLoadingProviders ? (
            <div className={cn(CONTAINER_CLASS)}>
              <p className="text-foreground-light">Loading providers...</p>
            </div>
          ) : userProviders && (userProviders.length > 0) ? (
            userProviders.map((provider) => {
              return (
                <div key={provider.identityProvider} className={cn(CONTAINER_CLASS, 'items-start justify-start')}>
                  <div className="flex-grow mt-0.5">
                    <p className="capitalize">{provider.identityProvider}</p>
                    <p className="text-xs text-foreground-light">
                      Linked as "{provider.userName}" ("{provider.userId}").
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className={cn(CONTAINER_CLASS)}>
              <p className="text-foreground-light">No providers found</p>
            </div>
          )}
        </div>

        <Separator />

        <div className={cn('flex flex-col', PANEL_PADDING)}>
          <p>Danger zone</p>
          <p className="text-sm text-foreground-light">
            Be wary of the following features as they cannot be undone.
          </p>
        </div>

        <div className={cn('flex flex-col -space-y-1 !pt-0', PANEL_PADDING)}>
          <RowAction
            title="Remove MFA factors"
            description="Removes all MFA factors associated with the user"
            button={{
              icon: <ShieldOff />,
              text: 'Remove MFA factors',
              disabled: !canRemoveMFAFactors,
              onClick: () => setIsDeleteFactorsModalOpen(true),
            }}
            className="!bg border-destructive-400"
          />
          <RowAction
            title={isBanned ? 'User is currently banned' : 'Ban user'}
            description={
              isBanned
                ? 'User has no access to the project'
                : 'Revoke access to the project for a set duration'
            }
            button={{
              icon: <Ban />,
              text: isBanned ? 'Unban user' : 'Ban user',
              disabled: !canUpdateUser,
              onClick: () => {
                if (isBanned) {
                  setIsUnbanModalOpen(true)
                } else {
                  setIsBanModalOpen(true)
                }
              },
            }}
            className="!bg border-destructive-400"
          />
          <RowAction
            title="Delete user"
            description="User will no longer have access to the project"
            button={{
              icon: <Trash />,
              type: 'danger',
              text: 'Delete user',
              disabled: !canRemoveUser,
              onClick: () => setIsDeleteModalOpen(true),
            }}
            className="!bg border-destructive-400"
          />
        </div>
      </div>

      <DeleteUserModal
        visible={isDeleteModalOpen}
        selectedUser={user}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteSuccess={() => {
          setIsDeleteModalOpen(false)
          onDeleteSuccess()
        }}
      />

      <ConfirmationModal
        visible={isDeleteFactorsModalOpen}
        variant="warning"
        title="Confirm to remove MFA factors"
        confirmLabel="Remove factors"
        confirmLabelLoading="Removing"
        onCancel={() => setIsDeleteFactorsModalOpen(false)}
        onConfirm={() => handleDeleteFactors()}
        alert={{
          base: { variant: 'warning' },
          title:
            "Removing MFA factors will drop the user's authentication assurance level (AAL) to AAL1",
          description: 'Note that this does not sign the user out',
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to remove the MFA factors for the user{' '}
          <span className="text-foreground">
            {user.email ?? user.attributes.phone ?? 'this user'}
          </span>
          ?
        </p>
      </ConfirmationModal>

      <BanUserModal visible={isBanModalOpen} user={user} onClose={() => setIsBanModalOpen(false)} />

      <ConfirmationModal
        variant="warning"
        visible={isUnbanModalOpen}
        title="Confirm to unban user"
        loading={isUpdatingUser}
        confirmLabel="Unban user"
        confirmLabelLoading="Unbanning"
        onCancel={() => setIsUnbanModalOpen(false)}
        onConfirm={() => handleUnban()}
      >
        <p className="text-sm text-foreground-light">
          The user will have access to your project again once unbanned. Are you sure you want to
          unban this user?
        </p>
      </ConfirmationModal>
    </>
  )
}

export const RowData = ({ property, value }: { property: string; value?: string | boolean }) => {
  return (
    <>
      <div className="flex items-center gap-x-2 group justify-between">
        <p className=" text-foreground-lighter text-xs">{property}</p>
        {typeof value === 'boolean' ? (
          <div className="h-[26px] flex items-center justify-center min-w-[70px]">
            {value ? (
              <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
                <Check size={10} className="text-contrast" strokeWidth={4} />
              </div>
            ) : (
              <div className="rounded-full w-4 h-4 dark:bg-white bg-black flex items-center justify-center">
                <X size={10} className="text-contrast" strokeWidth={4} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-x-2 h-[26px] font-mono min-w-[40px]">
            <p className="text-xs">{!value ? '-' : value}</p>
            {!!value && (
              <CopyButton
                iconOnly
                type="text"
                icon={<Copy />}
                className="transition opacity-0 group-hover:opacity-100 px-1"
                text={value}
              />
            )}
          </div>
        )}
      </div>
      <Separator />
    </>
  )
}

export const RowAction = ({
  title,
  description,
  button,
  success,
  className,
}: {
  title: string
  description: string
  button: {
    icon: ReactNode
    type?: ComponentProps<typeof Button>['type']
    text: string
    disabled?: boolean
    isLoading?: boolean
    onClick: () => void
  }
  success?: {
    title: string
    description: string
  }
  className?: string
}) => {
  const disabled = button?.disabled ?? false

  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      <div>
        <p>{success ? success.title : title}</p>
        <p className="text-xs text-foreground-light">
          {success ? success.description : description}
        </p>
      </div>

      <ButtonTooltip
        type={button?.type ?? 'default'}
        icon={success ? <Check className="text-brand" /> : button.icon}
        loading={button.isLoading ?? false}
        onClick={button.onClick}
        disabled={disabled}
        tooltip={{
          content: {
            side: 'bottom',
            text: disabled
              ? `You need additional permissions to ${button.text.toLowerCase()}`
              : undefined,
          },
        }}
      >
        {button.text}
      </ButtonTooltip>
    </div>
  )
}
