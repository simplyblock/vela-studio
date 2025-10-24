import { toast } from 'sonner'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useHooksEnableMutation } from 'data/database/hooks-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { Admonition } from 'ui-patterns'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export const WebhooksOverviewTab = () => {
  const { data: branch } = useSelectedBranchQuery()

  const {
    data: schemas,
    isSuccess: isSchemasLoaded,
    refetch,
  } = useSchemasQuery({
    branch,
  })

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')
  // FIXME: need permission implemented 
  const { can: canReadWebhooks, isLoading: isLoadingPermissions } = useCheckPermissions("branch:settings:read")

  const { mutate: enableHooks, isLoading: isEnablingHooks } = useHooksEnableMutation({
    onSuccess: async () => {
      await refetch()
      toast.success('Successfully enabled webhooks')
    },
  })

  const enableHooksForProject = async () => {
    if (!branch) return console.error('Branch is required')
    enableHooks({ branch })
  }

  if (!isSchemasLoaded || isLoadingPermissions) {
    return (
      <div className="p-10">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!canReadWebhooks) {
    return (
      <div className="p-10">
        <NoPermission isFullPage resourceText="view database webhooks" />
      </div>
    )
  }

  return (
    <IntegrationOverviewTab
      actions={
        isSchemasLoaded && isHooksEnabled ? null : (
          <Admonition
            showIcon={false}
            type="default"
            title="Enable database webhooks on your project"
          >
            <p>
              Database Webhooks can be used to trigger serverless functions or send requests to an
              HTTP endpoint
            </p>
            <ButtonTooltip
              className="w-fit"
              onClick={() => enableHooksForProject()}
              disabled={isEnablingHooks}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canReadWebhooks
                    ? 'You need additional permissions to enable webhooks'
                    : undefined,
                },
              }}
            >
              Enable webhooks
            </ButtonTooltip>
          </Admonition>
        )
      }
    />
  )
}
