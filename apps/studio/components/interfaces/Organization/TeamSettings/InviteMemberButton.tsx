import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationCreateInvitationMutation } from 'data/organization-members/organization-invitation-create-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useProfile } from 'lib/profile'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export const InviteMemberButton = () => {
  const { slug } = useParams()
  const { profile } = useProfile()

  const { organizationMembersCreate: organizationMembersCreationEnabled } = useIsFeatureEnabled([
    'organization_members:create',
  ])

  const [isOpen, setIsOpen] = useState(false)

  const { data: members } = useOrganizationMembersQuery({ slug })

  const canInviteMembers = useCheckPermissions('org:user:admin')

  const { mutate: inviteMember, isLoading: isInviting } = useOrganizationCreateInvitationMutation()

  const FormSchema = z.object({
    email: z.string().email('Must be a valid email address').min(1, 'Email is required'),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '' },
  })

  const onInviteMember = async (values: z.infer<typeof FormSchema>) => {
    if (!slug) return console.error('Slug is required')
    if (profile?.id === undefined) return console.error('Profile ID required')

    const existingMember = (members ?? []).find(
      (member) => member.primary_email === values.email.toLowerCase()
    )
    if (existingMember !== undefined) {
      if ((existingMember as any).invited_id) {
        return toast('User has already been invited to this organization')
      } else {
        return toast('User is already in this organization')
      }
    }
    // TODO: need to either remove the roleId from this invitation OR add back the roleId select to this form
    inviteMember(
      {
        slug,
        email: values.email.toLowerCase(),
        roleId: '', // no role selection for now
      },
      {
        onSuccess: () => {
          toast.success('Successfully sent invitation to new member')
          setIsOpen(false)

          form.reset({
            email: '',
          })
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <ButtonTooltip
          type="primary"
          disabled={!canInviteMembers}
          className="pointer-events-auto flex-grow md:flex-grow-0"
          onClick={() => setIsOpen(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !organizationMembersCreationEnabled
                ? 'Inviting members is currently disabled'
                : !canInviteMembers
                  ? 'You need additional permissions to invite a member to this organization'
                  : undefined,
            },
          }}
        >
          Invite member
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Invite a member to this organization</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form_Shadcn_ {...form}>
          <form
            id="organization-invitation"
            className="flex flex-col gap-y-4"
            onSubmit={form.handleSubmit(onInviteMember)}
          >
            <DialogSection className="flex flex-col gap-y-4 pb-2">
              <FormField_Shadcn_
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Email address">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        autoFocus
                        {...field}
                        autoComplete="off"
                        disabled={isInviting}
                        placeholder="Enter email address"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogSectionSeparator />
            <DialogSection className="pt-0">
              <Button block htmlType="submit" loading={isInviting}>
                Send invitation
              </Button>
            </DialogSection>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
