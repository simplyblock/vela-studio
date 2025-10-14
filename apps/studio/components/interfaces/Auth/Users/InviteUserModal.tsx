import { Mail } from 'lucide-react'
import { toast } from 'sonner'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUserCreateMutation } from '../../../../data/auth/user-create-mutation'

export type InviteUserModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const InviteUserFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Must be a valid email address'),
})

const InviteUserModal = ({ visible, setVisible }: InviteUserModalProps) => {
  const { data: branch } = useSelectedBranchQuery()

  const { mutate: inviteUser, isLoading: isInvitingUser } = useUserCreateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Sent invite email to ${variables.user.email}`)
      setVisible(false)
    },
  })

  // FIXME: need permission implemented
  const { can: canInviteUsers } = { can: true }

  const generateRandomPassword = () => {
    const characters = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    return Array.from(crypto.getRandomValues(new Uint32Array(10)))
      .map((x) => characters[x % characters.length])
      .join('')
  }

  const form = useForm<z.infer<typeof InviteUserFormSchema>>({
    resolver: zodResolver(InviteUserFormSchema),
    defaultValues: { email: '' },
  })

  const onInviteUser = async (values: any) => {
    if (!branch) return console.error('Branch is required')
    inviteUser({
      branch,
      user: {
        email: values.email,
        password: generateRandomPassword(),
        autoConfirmUser: false,
        forcePasswordUpdate: true,
      },
    })
  }

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Invite a new user</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form_Shadcn_ {...form}>
          <form
            id="create-user"
            className="flex flex-col gap-y-4 p-6"
            onSubmit={form.handleSubmit(onInviteUser)}
          >
            <FormField_Shadcn_
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem_Shadcn_ className="flex flex-col gap-1">
                  <FormLabel_Shadcn_>Email address</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <div className="items-center relative">
                      <Mail
                        size={18}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        strokeWidth={1.5}
                      />
                      <Input_Shadcn_
                        autoFocus
                        {...field}
                        autoComplete="off"
                        type="email"
                        name="email"
                        placeholder="user@example.com"
                        disabled={isInvitingUser}
                        className="pl-8"
                      />
                    </div>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />

            <Button
              block
              size="small"
              htmlType="submit"
              loading={isInvitingUser}
              disabled={!canInviteUsers || isInvitingUser}
            >
              Invite user
            </Button>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}

export default InviteUserModal
