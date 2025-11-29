import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  Input,
  SheetFooter,
} from 'ui'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useAuthProviderCreateMutation } from 'data/auth/auth-provider-create-mutation'
import { toast } from 'sonner'
import { authProviderFieldProperties, creatableAuthProviderFields } from 'lib/authProviders'
import FormField from './FormField'
import { ButtonTooltip } from '../../../ui/ButtonTooltip'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useParams } from 'common'
import { makeRandomString } from 'lib/helpers'

export type AddAuthProviderModalProps = {
  visible: boolean
  setVisible: (visible: boolean) => void
}

const AddAuthProviderModal = ({ visible, setVisible }: AddAuthProviderModalProps) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  const { mutate: createAuthProvider, isLoading: isCreatingProvider } =
    useAuthProviderCreateMutation()

  const { can: canUpdateConfig } = useCheckPermissions('branch:auth:admin')
  const { data: customDomainData } = useCustomDomainsQuery({ orgRef, projectRef })

  const { data: settings } = useProjectSettingsV2Query({ orgRef, projectRef })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = `${protocol}://${endpoint}`

  const onCreateAuthProvider = async (values: any, { resetForm }: any) => {
    if (!orgRef) return console.error('Org ref is required')
    if (!projectRef) return console.error('Project ref is required')
    if (!branchRef) return console.error('Branch ref is required')

    createAuthProvider(
      {
        orgRef,
        projectRef,
        branchRef,
        create: {
          ...values,
          alias: makeRandomString(20),
        },
      },
      {
        onSuccess: () => {
          resetForm({ values: { ...values }, initialValues: {} })
          setVisible(false)
          toast.success('Successfully created auth provider')
        },
      }
    )
  }

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create auth provider</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form
          id={`add-identity-provider-form`}
          name={`add-identity-provider-form`}
          initialValues={{}}
          onSubmit={onCreateAuthProvider}
          className="flex-1 overflow-hidden flex flex-col"
        >
          {({ handleReset, values, setFieldValue }: any) => {
            const noChanges = JSON.stringify({}) === JSON.stringify(values)
            return (
              <>
                <div className="flex-1 overflow-y-auto group py-6 px-4 md:px-6 text-foreground">
                  <div className="mx-auto max-w-lg space-y-6">
                    {creatableAuthProviderFields.map((x: string) => (
                      <FormField
                        key={x}
                        name={x}
                        setFieldValue={setFieldValue}
                        properties={authProviderFieldProperties[x]}
                        formValues={values}
                        disabled={!canUpdateConfig}
                      />
                    ))}

                    <Input
                      copy
                      readOnly
                      disabled
                      label="Callback URL (for OAuth)"
                      value={
                        customDomainData?.customDomain?.status === 'active'
                          ? `https://${customDomainData.customDomain?.hostname}/auth/v1/callback`
                          : `${apiUrl}/auth/v1/callback`
                      }
                    />
                  </div>
                </div>
                <SheetFooter className="shrink-0">
                  <div className="flex items-center justify-end w-full">
                    <div className="flex items-center gap-x-3">
                      <Button
                        type="default"
                        htmlType="reset"
                        onClick={() => {
                          handleReset()
                        }}
                        disabled={isCreatingProvider}
                      >
                        Cancel
                      </Button>
                      <ButtonTooltip
                        htmlType="submit"
                        loading={isCreatingProvider}
                        disabled={isCreatingProvider || !canUpdateConfig || noChanges}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: !canUpdateConfig
                              ? 'You need additional permissions to update provider settings'
                              : undefined,
                          },
                        }}
                      >
                        Save
                      </ButtonTooltip>
                    </div>
                  </div>
                </SheetFooter>
              </>
            )
          }}
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddAuthProviderModal
