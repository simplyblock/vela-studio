import { useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import type { components } from 'data/api'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'

import { BASE_PATH } from 'lib/constants'
import {
  Button,
  cn,
  Form,
  Input,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import type { Provider } from './AuthProvidersForm.types'
import FormField from './FormField'
import {
  authProviderFieldProperties,
  authProviderIcon,
  changeableAuthProviderFields,
} from 'lib/authProviders'
import { Lock, Trash } from 'lucide-react'
import { PANEL_PADDING } from '../Users/Users.constants'
import { RowAction } from '../Users/UserOverview'
import { useAuthProviderDeleteMutation } from 'data/auth/auth-provider-delete-mutation'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { timeout } from 'lib/helpers'
import { useAuthProviderUpdateMutation } from 'data/auth/auth-provider-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

interface ProviderFormProps {
  config: components['schemas']['AuthProviderResponse']
  provider: Provider
}

const doubleNegativeKeys = ['SMS_AUTOCONFIRM']

export const ProviderForm = ({ config, provider }: ProviderFormProps) => {
  const { slug: orgId, ref: projectId, branch: branchId } = useParams()
  const [urlProvider, setUrlProvider] = useQueryState('provider', { defaultValue: '' })

  const [open, setOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { mutate: deleteAuthProvider, isLoading: isDeletingConfig } =
    useAuthProviderDeleteMutation()
  const { mutate: updateAuthProvider, isLoading: isUpdatingProvider } =
    useAuthProviderUpdateMutation()

  const { can: canUpdateConfig } = useCheckPermissions('branch:auth:admin')

  const { data: settings } = useProjectSettingsV2Query({ orgRef: orgId, projectRef: projectId })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = `${protocol}://${endpoint}`

  const { data: customDomainData } = useCustomDomainsQuery({ orgRef: orgId, projectRef: projectId })

  const providerIcon = useMemo(() => authProviderIcon(config), [config])

  const initialValues = (() => {
    const values: { [x: string]: string | boolean } = {}
    changeableAuthProviderFields.forEach((key) => {
      const isDoubleNegative = doubleNegativeKeys.includes(key)
      if (isDoubleNegative) {
        values[key] = !(config as any)[key]
      } else {
        const configValue = (config as any).config[key]
        values[key] = configValue
          ? configValue
          : typeof (config as any)[key] === 'boolean'
            ? false
            : ''
      }
    })
    return values
  })()

  const handleDeleteAuthProvider = async () => {
    if (!orgId) return console.error('Org id is required')
    if (!projectId) return console.error('Project id is required')
    if (!branchId) return console.error('Branch id is required')
    if (!config.alias) return console.error('Auth provider alias is required')

    await timeout(200)
    deleteAuthProvider({
      orgId,
      projectId,
      branchId,
      authProviderName: config.alias,
    })
  }

  const onSubmit = (values: any, { resetForm }: any) => {
    if (!orgId) return console.error('Org id is required')
    if (!projectId) return console.error('Project id is required')
    if (!branchId) return console.error('Branch id is required')
    if (!config.alias) return console.error('Auth provider alias is required')

    const payload = {
      ...config,
      config: values,
    }

    updateAuthProvider(
      {
        orgId,
        projectId,
        branchId,
        authProviderName: config.alias,
        update: payload,
      },
      {
        onSuccess: () => {
          resetForm({ values: { ...values }, initialValues: { ...values } })
          setOpen(false)
          setUrlProvider(null)
          toast.success('Successfully updated settings')
        },
      }
    )
  }

  // Handle clicking on a provider in the list
  const handleProviderClick = () => setUrlProvider(config.alias!)

  const handleOpenChange = (isOpen: boolean) => {
    // Remove provider query param from URL when closed
    if (!isOpen) setUrlProvider(null)
  }

  // Open or close the form based on the query parameter
  useEffect(() => {
    const isProviderInQuery = urlProvider.toLowerCase() === config?.alias?.toLowerCase() ?? false
    setOpen(isProviderInQuery)
  }, [urlProvider, config.alias])

  return (
    <>
      <ResourceItem
        onClick={handleProviderClick}
        media={
          providerIcon ? (
            <img
              src={`${BASE_PATH}/img/icons/${providerIcon}.svg`}
              width={18}
              height={18}
              alt={`${config.displayName} auth icon`}
            />
          ) : (
            <Lock width={18} height={18} name={`${config.displayName} auth icon`} />
          )
        }
      >
        {config.displayName}
      </ResourceItem>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="flex flex-col gap-0">
          <SheetHeader className="shrink-0 flex items-center gap-4">
            {providerIcon ? (
              <img
                src={`${BASE_PATH}/img/icons/${providerIcon}.svg`}
                width={18}
                height={18}
                alt={`${config.displayName} auth icon`}
              />
            ) : (
              <Lock width={18} height={18} name={`${config.displayName} auth icon`} />
            )}
            <SheetTitle>{config.displayName}</SheetTitle>
          </SheetHeader>
          <Form
            id={`provider-${config.displayName}-form`}
            name={`provider-${config.displayName}-form`}
            initialValues={initialValues}
            onSubmit={onSubmit}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {({ handleReset, initialValues, values, setFieldValue }: any) => {
              const noChanges = JSON.stringify(initialValues) === JSON.stringify(values)
              return (
                <>
                  <div className="flex-1 overflow-y-auto group py-6 px-4 md:px-6 text-foreground">
                    <div className="mx-auto max-w-lg space-y-6">
                      {changeableAuthProviderFields.map((x: string) => (
                        <FormField
                          key={x}
                          name={x}
                          setFieldValue={setFieldValue}
                          properties={authProviderFieldProperties[x]}
                          formValues={values}
                          disabled={!canUpdateConfig}
                        />
                      ))}

                      {provider?.misc?.alert && (
                        <Admonition
                          type="warning"
                          title={provider?.misc?.alert?.title}
                          description={
                            <>
                              <ReactMarkdown>{provider?.misc?.alert?.description}</ReactMarkdown>
                            </>
                          }
                        />
                      )}

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
                        descriptionText={
                          <Markdown
                            content={provider?.misc?.helper}
                            className="text-foreground-lighter"
                          />
                        }
                      />
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
                        title="Delete auth provider"
                        description="Users with this auth provider will no longer have access to the project"
                        button={{
                          icon: <Trash />,
                          type: 'danger',
                          text: 'Delete auth provider',
                          onClick: () => setIsDeleteModalOpen(true),
                        }}
                        className="!bg border-destructive-400"
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
                            setOpen(false)
                            setUrlProvider(null)
                          }}
                          disabled={isDeletingConfig || isUpdatingProvider}
                        >
                          Cancel
                        </Button>
                        <ButtonTooltip
                          htmlType="submit"
                          loading={isDeletingConfig || isUpdatingProvider}
                          disabled={isDeletingConfig || isUpdatingProvider || !canUpdateConfig || noChanges}
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
        </SheetContent>
      </Sheet>
      <ConfirmationModal
        visible={isDeleteModalOpen}
        variant="warning"
        title="Confirm to remove auth provider"
        confirmLabel="Remove provider"
        confirmLabelLoading="Removing"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => handleDeleteAuthProvider()}
        alert={{
          base: { variant: 'warning' },
          title:
            'Removing the auth provider will render users unable to sign in with this provider. Users will be able to sign in with other providers, if configured.',
          description: 'Note that this does not remove users',
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to remove the auth provider{' '}
          <span className="text-foreground">{config.displayName}</span>?
        </p>
      </ConfirmationModal>
    </>
  )
}
