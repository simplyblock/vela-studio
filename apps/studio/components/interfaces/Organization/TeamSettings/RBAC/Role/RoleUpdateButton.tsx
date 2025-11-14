import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Pencil } from 'lucide-react'
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
  Form_Shadcn_,
  FormField_Shadcn_,
  FormControl_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { OrganizationRole } from 'types'
import { useOrganizationRoleUpdateMutation } from 'data/organizations/organization-role-update-mutation'
import { RolePermission } from 'data/organizations/organization-role-create-mutation'

interface UpdateRoleButtonProps {
  role: OrganizationRole
}

const FormSchema = z.object({
  name: z.string().min(3, 'Role name must be at least 3 characters'),
  description: z.string().optional(),
})

const UpdateRoleButton = ({ role }: UpdateRoleButtonProps) => {
  const { slug } = useParams()
  const [open, setOpen] = useState(false)

  const { mutate: updateRole, isLoading: isUpdating } = useOrganizationRoleUpdateMutation()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: role.name,
      description: role.description ?? '',
    },
  })

  // Ensure form stays in sync if the role changes while dialog is closed/open
  const resetFormFromRole = () => {
    form.reset({
      name: role.name,
      description: role.description ?? '',
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      resetFormFromRole()
    }
  }

  const onSubmit = (values: z.infer<typeof FormSchema>) => {
    if (!slug) return console.error('Slug is required')

    updateRole(
      {
        slug,
        roleId: role.id,
        name: values.name,
        // type and permissions unchanged here
        roleType: role.role_type,
        description: values.description || undefined,
        permissions: role.access_rights as RolePermission[] ?? [],
      },
      {
        onSuccess: () => {
          toast.success('Role updated successfully')
          setOpen(false)
        },
        onError: (error: any) => {
          toast.error(error?.message ?? 'Failed to update role')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="text"
          size="tiny"
          className="px-1"
          aria-label={`Edit role ${role.name}`}
        >
          <Pencil size={14} />
        </Button>
      </DialogTrigger>

      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Edit role</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form className="flex flex-col gap-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-4">
              <FormField_Shadcn_
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Role name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        autoFocus
                        disabled={isUpdating}
                        placeholder="Enter role name"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Description (optional)">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        disabled={isUpdating}
                        placeholder="Add an optional description..."
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection>
              <Button block htmlType="submit" loading={isUpdating}>
                Save changes
              </Button>
            </DialogSection>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}

export default UpdateRoleButton
