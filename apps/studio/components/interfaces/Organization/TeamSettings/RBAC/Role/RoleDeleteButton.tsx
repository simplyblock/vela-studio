// DeleteRoleButton.tsx
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useParams } from 'common'
import { toast } from 'sonner'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogSection,
  DialogSectionSeparator,
} from 'ui'

import { OrganizationRole } from 'types'
import { useOrganizationRoleDeleteMutation } from 'data/organizations/organization-role-delete-mutation'

interface DeleteRoleButtonProps {
  role: OrganizationRole
}

const DeleteRoleButton = ({ role }: DeleteRoleButtonProps) => {
  const { slug } = useParams()
  const [open, setOpen] = useState(false)

  const isSystemRole = !role.is_deletable

  const { mutate: deleteRole, isLoading: isDeleting } = useOrganizationRoleDeleteMutation({
    onSuccess: () => {
      toast.success('Role deleted successfully')
      setOpen(false)
    },
  })

  const handleDelete = () => {
    if (!slug) return console.error('Slug is required')

    deleteRole({
      slug,
      roleId: role.id,
    })
  }

  if (isSystemRole) {
    return (
      <Button type="text" size="tiny" className="px-1" disabled aria-label="System role">
        <Trash2 size={14} className="opacity-40" />
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="text"
          size="tiny"
          className="px-1 text-red-900 hover:text-red-1000"
          aria-label={`Delete role ${role.name}`}
        >
          <Trash2 size={14} />
        </Button>
      </DialogTrigger>

      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Delete role</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="space-y-3">
          <p className="text-sm text-foreground">
            Are you sure you want to delete the role{' '}
            <span className="font-medium">{role.name}</span>?
          </p>
          <p className="text-xs text-foreground-muted">
            This action cannot be undone. Users assigned to this role may lose access depending on
            their other roles.
          </p>
        </DialogSection>

        <DialogSectionSeparator />

        <DialogSection className="flex justify-end gap-2">
          <Button
            type="default"
            size="tiny"
            disabled={isDeleting}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="danger"
            size="tiny"
            loading={isDeleting}
            onClick={handleDelete}
          >
            Delete role
          </Button>
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteRoleButton
