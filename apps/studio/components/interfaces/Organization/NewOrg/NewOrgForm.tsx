import _ from 'lodash'
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
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { SetupIntentResponse } from 'data/stripe/setup-intent-mutation'
import { useProfile } from 'lib/profile'

interface NewOrgFormProps {
  setupIntent?: SetupIntentResponse
}

const formSchema = z.object({
  name: z.string().min(1),
  spend_cap: z.boolean(),
})

type FormState = z.infer<typeof formSchema>

/**
 * No org selected yet, create a new one
 * [Joshen] Need to refactor to use Form_Shadcn here
 */
const NewOrgForm = ({}: NewOrgFormProps) => {
  const router = useRouter()
  const user = useProfile()
  const { data: organizations, isSuccess } = useOrganizationsQuery()
  const { data: projects } = useProjectsQuery()

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
    name: '',
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

    const { name, spend_cap } = router.query

    if (typeof name === 'string') updateForm('name', name)
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

  async function createOrg() {
    createOrganization({
      name: formState.name,
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
    await handleSubmit()
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
      </ConfirmationModal>
    </form>
  )
}

export default NewOrgForm
