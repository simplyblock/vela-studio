import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { number, object, string } from 'yup'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useAuthMFAQuery } from 'data/auth/auth-mfa-query'
import { useAuthMFAUpdateMutation } from 'data/auth/auth-mfa-update-mutation'

import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

function determineMFAStatus(verifyEnabled: boolean, enrollEnabled: boolean) {
  return verifyEnabled ? (enrollEnabled ? 'Enabled' : 'Verify Enabled') : 'Disabled'
}

const MFAFactorSelectionOptions = [
  {
    label: 'Enabled',
    value: 'enabled',
  },
  {
    label: 'Verify Enabled',
    value: 'verify-enabled',
  },
  {
    label: 'Disabled',
    value: 'disabled',
  },
]

const totpSchema = object({
  MFA_TOTP: string().required(),
})

const MfaAuthSettingsForm = () => {
  const { slug: orgId, ref: projectId, branch: branchId } = useParams()
  const { data: authMFA, error: authConfigError, isError } = useAuthMFAQuery({ orgId, projectId, branchId })
  const { mutate: updateMFAConfig } = useAuthMFAUpdateMutation()

  // Separate loading states for each form
  const [isUpdatingTotpForm, setIsUpdatingTotpForm] = useState(false)

  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false)
  // FIXME: need permission implemented 
  const { can: canReadConfig } = {can:true}
  // FIXME: need permission implemented 
  const { can: canUpdateConfig } = {can:true}

  const totpForm = useForm({
    resolver: yupResolver(totpSchema),
    defaultValues: {
      MFA_TOTP: 'Enabled',
    },
  })

  useEffect(() => {
    if (authMFA) {
      if (!isUpdatingTotpForm) {
        totpForm.reset({ MFA_TOTP: authMFA.status })
      }
    }
  }, [authMFA, isUpdatingTotpForm])

  const onSubmitTotpForm = (values: any) => {
    if (orgId === undefined || projectId === undefined || branchId === undefined) return;

    setIsUpdatingTotpForm(true)

    updateMFAConfig(
      { orgId: orgId, projectId: projectId, branchId: branchId, status: values.MFA_TOTP },
      {
        onError: (error) => {
          toast.error(`Failed to update TOTP settings: ${error?.message}`)
          setIsUpdatingTotpForm(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated TOTP settings')
          setIsUpdatingTotpForm(false)
        },
      }
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  if (!canReadConfig) {
    return <NoPermission resourceText="view auth configuration settings" />
  }

  return (
    <>
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">
          Multi-Factor Authentication (MFA)
        </ScaffoldSectionTitle>

        <Form_Shadcn_ {...totpForm}>
          <form onSubmit={totpForm.handleSubmit(onSubmitTotpForm)} className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <FormField_Shadcn_
                  control={totpForm.control}
                  name="MFA_TOTP"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="TOTP (App Authenticator)"
                      description="Control use of TOTP (App Authenticator) factors"
                    >
                      <FormControl_Shadcn_>
                        <Select_Shadcn_
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!canUpdateConfig}
                        >
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Select status" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {MFAFactorSelectionOptions.map((option) => (
                              <SelectItem_Shadcn_ key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardFooter className="justify-end space-x-2">
                {totpForm.formState.isDirty && (
                  <Button type="default" onClick={() => totpForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={!canUpdateConfig || isUpdatingTotpForm || !totpForm.formState.isDirty}
                  loading={isUpdatingTotpForm}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </ScaffoldSection>
    </>
  )
}

export default MfaAuthSettingsForm
