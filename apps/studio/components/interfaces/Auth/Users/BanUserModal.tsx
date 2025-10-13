import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useUserUpdateMutation } from 'data/auth/user-update-mutation'
import { User } from 'data/auth/users-infinite-query'
import {
  Button,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Modal,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

interface BanUserModalProps {
  visible: boolean
  user: User
  onClose: () => void
}

export const BanUserModal = ({ visible, user, onClose }: BanUserModalProps) => {
  const { data: branch } = useSelectedBranchQuery()

  const { mutate: updateUser, isLoading: isBanningUser } = useUserUpdateMutation({
    onSuccess: (_, vars) => {
      onClose()
    },
  })

  const FormSchema = z.object({})
  type FormType = z.infer<typeof FormSchema>
  const form = useForm<FormType>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
  })

  const onSubmit = () => {
    if ((branch?.organization_id === undefined) || (branch?.project_id === undefined) || (branch?.id === undefined)) {
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
      enabled: false,
    })
  }

  useEffect(() => {
    if (visible) form.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="small"
      header="Confirm to ban user"
      onCancel={() => onClose()}
    >
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Modal.Content className="flex flex-col gap-y-3">
            <p className="text-sm">
              This will revoke the user's access to your project and prevent them from logging in.
            </p>
          </Modal.Content>
          <Separator />
          <Modal.Content className="flex justify-end gap-2">
            <Button type="default" disabled={isBanningUser} onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="warning" htmlType="submit" loading={isBanningUser}>
              Confirm ban
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}
