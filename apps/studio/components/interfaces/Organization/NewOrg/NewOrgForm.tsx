import _ from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsString, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { LOCAL_STORAGE_KEYS } from 'common'
import Panel from 'components/ui/Panel'
import { useOrganizationCreateMutation } from 'data/organizations/organization-create-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import {
  Button,
  Input_Shadcn_,
  Label_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useConfirmPendingSubscriptionCreateMutation } from 'data/subscriptions/org-subscription-confirm-pending-create'
import { useTheme } from 'next-themes'
import { SetupIntentResponse } from 'data/stripe/setup-intent-mutation'
import { useProfile } from 'lib/profile'
import type { CustomerAddress, CustomerTaxId } from 'data/organizations/types'
const ORG_KIND_DEFAULT = 'PERSONAL'

const ORG_SIZE_DEFAULT = '1'

interface NewOrgFormProps {
  onPaymentMethodReset: () => void
  setupIntent?: SetupIntentResponse
  onPlanSelected: (plan: string) => void
}

const plans = ['FREE', 'PRO', 'TEAM'] as const

const formSchema = z.object({
  plan: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(plans)),
  name: z.string().min(1),
  kind: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(
      z.enum(['PERSONAL', 'EDUCATIONAL', 'STARTUP', 'AGENCY', 'COMPANY', 'UNDISCLOSED'] as const)
    ),
  size: z.enum(['1', '10', '50', '100', '300'] as const),
  spend_cap: z.boolean(),
})

type FormState = z.infer<typeof formSchema>

const newMandatoryAddressInput = true

/**
 * No org selected yet, create a new one
 * [Joshen] Need to refactor to use Form_Shadcn here
 */
const NewOrgForm = ({ onPaymentMethodReset, setupIntent, onPlanSelected }: NewOrgFormProps) => {
  const router = useRouter()
  const user = useProfile()
  const { data: organizations, isSuccess } = useOrganizationsQuery()
  const { data: projects } = useProjectsQuery()
  const { resolvedTheme } = useTheme()

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const freeOrgs = (organizations || []).filter((it) => it.plan.id === 'free')

  const projectsByOrg = useMemo(() => {
    return _.groupBy(projects || [], 'organization_slug')
  }, [projects])

  const [isOrgCreationConfirmationModalVisible, setIsOrgCreationConfirmationModalVisible] =
    useState(false)

  const [formState, setFormState] = useState<FormState>({
    plan: 'FREE',
    name: '',
    kind: ORG_KIND_DEFAULT,
    size: ORG_SIZE_DEFAULT,
    spend_cap: true,
  })

  const [searchParams] = useQueryStates({
    returnTo: parseAsString.withDefault(''),
    auth_id: parseAsString.withDefault(''),
  })

  const updateForm = (key: keyof FormState, value: unknown) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    if (!router.isReady) return

    const { name, kind, plan, size, spend_cap } = router.query

    if (typeof name === 'string') updateForm('name', name)
    if (typeof kind === 'string') updateForm('kind', kind)
    if (typeof plan === 'string' && plans.includes(plan.toUpperCase() as (typeof plans)[number])) {
      const uppercasedPlan = plan.toUpperCase() as (typeof plans)[number]
      updateForm('plan', uppercasedPlan)
      onPlanSelected(uppercasedPlan)
    }
    if (typeof size === 'string') updateForm('size', size)
    if (typeof spend_cap === 'string') updateForm('spend_cap', spend_cap === 'true')
  }, [router.isReady])

  useEffect(() => {
    if (!formState.name && organizations?.length === 0 && !user.isLoading) {
      const prefilledOrgName = user.profile?.username ? user.profile.username + `'s Org` : 'My Org'
      updateForm('name', prefilledOrgName)
    }
  }, [isSuccess])

  const [newOrgLoading, setNewOrgLoading] = useState(false)

  const { mutate: createOrganization } = useOrganizationCreateMutation({
    onSuccess: async (org) => {
      onOrganizationCreated(org as { slug: string })
    },
    onError: (data) => {
      toast.error(data.message, { duration: 10_000 })
      setNewOrgLoading(false)
    },
  })

  const { mutate: confirmPendingSubscriptionChange } = useConfirmPendingSubscriptionCreateMutation({
    onSuccess: (data) => {
      if (data && 'slug' in data) {
        onOrganizationCreated({ slug: data.slug })
      }
    },
  })

  const onOrganizationCreated = (org: { slug: string }) => {
    const prefilledProjectName = user.profile?.username
      ? user.profile.username + `'s Project`
      : 'My Project'

    if (searchParams.returnTo && searchParams.auth_id) {
      router.push(`${searchParams.returnTo}?auth_id=${searchParams.auth_id}`, undefined, {
        shallow: false,
      })
    } else {
      router.push(`/new/${org.slug}?projectName=${prefilledProjectName}`)
    }
  }

  function validateOrgName(name: any) {
    const value = name ? name.trim() : ''
    return value.length >= 1
  }

  async function createOrg(
    paymentMethodId?: string,
    customerData?: {
      address: CustomerAddress | null
      billing_name: string | null
      tax_id: CustomerTaxId | null
    }
  ) {
    const dbTier = formState.plan === 'PRO' && !formState.spend_cap ? 'PAYG' : formState.plan

    createOrganization({
      name: formState.name,
      kind: formState.kind,
      tier: ('tier_' + dbTier.toLowerCase()) as
        | 'tier_payg'
        | 'tier_pro'
        | 'tier_free'
        | 'tier_team',
      ...(formState.kind == 'COMPANY' ? { size: formState.size } : {}),
      payment_method: paymentMethodId,
      billing_name: dbTier === 'FREE' ? undefined : customerData?.billing_name,
      address: dbTier === 'FREE' ? null : customerData?.address,
      tax_id: dbTier === 'FREE' ? undefined : customerData?.tax_id ?? undefined,
    })
  }

  const handleSubmit = async () => {
    setNewOrgLoading(true)

    await createOrg()
  }

  const onSubmitWithOrgCreation = async (event: any) => {
    event.preventDefault()

    const isOrgNameValid = validateOrgName(formState.name)
    if (!isOrgNameValid) {
      return toast.error('Organization name is empty')
    }

    const hasFreeOrgWithProjects = freeOrgs.some((it) => projectsByOrg[it.slug]?.length > 0)

    if (hasFreeOrgWithProjects && formState.plan !== 'FREE') {
      setIsOrgCreationConfirmationModalVisible(true)
    } else {
      await handleSubmit()
    }
  }

  return (
    <form onSubmit={onSubmitWithOrgCreation}>
      <Panel
        title={
          <div key="panel-title">
            <h4>Create a new organization</h4>
          </div>
        }
        footer={
          <div key="panel-footer" className="flex w-full items-center justify-between">
            <Button
              type="default"
              disabled={newOrgLoading}
              onClick={() => {
                if (!!lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
                else router.push('/organizations')
              }}
            >
              Cancel
            </Button>
            <div className="flex items-center space-x-3">
              <p className="text-xs text-foreground-lighter">
                You can rename your organization later
              </p>
              <Button
                htmlType="submit"
                type="primary"
                loading={newOrgLoading}
                disabled={newOrgLoading}
              >
                Create organization
              </Button>
            </div>
          </div>
        }
        className="overflow-visible"
      >
        <Panel.Content>
          <p className="text-sm">This is your organization within Supabase.</p>
          <p className="text-sm text-foreground-light">
            For example, you can use the name of your company or department.
          </p>
        </Panel.Content>
        <Panel.Content className="Form section-block--body has-inputs-centered">
          <div className="grid grid-cols-3 w-full">
            <div>
              <Label_Shadcn_ htmlFor="name">Name</Label_Shadcn_>
            </div>
            <div className="col-span-2">
              <Input_Shadcn_
                id="name"
                autoFocus
                type="text"
                placeholder="Organization name"
                value={formState.name}
                onChange={(e) => updateForm('name', e.target.value)}
              />
              <div className="mt-1">
                <Label_Shadcn_
                  htmlFor="name"
                  className="text-foreground-lighter leading-normal text-sm"
                >
                  What's the name of your company or team?
                </Label_Shadcn_>
              </div>
            </div>
          </div>
        </Panel.Content>
      </Panel>

      <ConfirmationModal
        size="large"
        loading={false}
        visible={isOrgCreationConfirmationModalVisible}
        title={<>Confirm organization creation</>}
        confirmLabel="Create new organization"
        onCancel={() => setIsOrgCreationConfirmationModalVisible(false)}
        onConfirm={async () => {
          await handleSubmit()
          setIsOrgCreationConfirmationModalVisible(false)
        }}
        variant={'warning'}
      >
        <p className="text-sm text-foreground-light">
          Supabase{' '}
          <Link
            className="underline"
            href="/docs/guides/platform/billing-on-supabase"
            target="_blank"
          >
            bills per organization
          </Link>
          . If you want to upgrade your existing projects, upgrade your existing organization
          instead.
        </p>

        <ul className="mt-4 space-y-6">
          {freeOrgs
            .filter((it) => projectsByOrg[it.slug]?.length > 0)
            .map((org) => {
              const orgProjects = projectsByOrg[org.slug].map((it) => it.name)

              return (
                <li key={`org_${org.slug}`}>
                  <div className="flex justify-between text-sm">
                    <span>{org.name}</span>
                    <Button asChild type="primary" size="tiny">
                      <Link href={`/org/${org.slug}/billing?panel=subscriptionPlan`}>
                        Change Plan
                      </Link>
                    </Button>
                  </div>
                  <div className="text-foreground-light text-xs">
                    {orgProjects.length <= 2 ? (
                      <span>{orgProjects.join('and ')}</span>
                    ) : (
                      <div>
                        {orgProjects.slice(0, 2).join(', ')} and{' '}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="underline decoration-dotted">
                              {orgProjects.length - 2} other{' '}
                              {orgProjects.length === 3 ? 'project' : 'project'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <ul className="list-disc list-inside">
                              {orgProjects.slice(2).map((project) => (
                                <li>{project}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
        </ul>
      </ConfirmationModal>
    </form>
  )
}

export default NewOrgForm
