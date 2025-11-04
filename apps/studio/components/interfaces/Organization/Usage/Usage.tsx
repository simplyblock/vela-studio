import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import {
  ScaffoldContainer,
  ScaffoldContainerLegacy,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import DateRangePicker from 'components/ui/DateRangePicker'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { TIME_PERIODS_BILLING, TIME_PERIODS_REPORTS } from 'lib/constants/metrics'
import { cn, Listbox } from 'ui'
import Activity from './Activity'
import Egress from './Egress'
import Compute from './Compute'
import SizeAndCounts from './SizeAndCounts'
import TotalUsage from './TotalUsage'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const Usage = () => {
  const { slug: orgRef, projectRef, branch: branchRef } = useParams()
  const [dateRange, setDateRange] = useState<any>()
  const [selectedProjectRef, setSelectedProjectRef] = useState<string>()

  const canReadSubscriptions = useCheckPermissions('org:metering:read')

  const { data: organization } = useSelectedOrganizationQuery()
  const { data: projects, isSuccess } = useProjectsQuery()
  const {
    data: subscription,
    error: subscriptionError,
    isLoading: isLoadingSubscription,
    isError: isErrorSubscription,
    isSuccess: isSuccessSubscription,
  } = useOrgSubscriptionQuery({ orgRef: orgRef })

  const orgProjects = projects?.filter((project) => project.organization_id === organization?.id)

  useEffect(() => {
    if (projectRef && isSuccess && orgProjects !== undefined) {
      if (orgProjects.find((project) => project.id === projectRef)) {
        setSelectedProjectRef(projectRef)
      }
    }
    // [Joshen] Since we're already looking at isSuccess
  }, [projectRef, isSuccess])

  const billingCycleStart = useMemo(() => {
    return dayjs.unix(subscription?.current_period_start ?? 0).utc()
  }, [subscription])

  const billingCycleEnd = useMemo(() => {
    return dayjs.unix(subscription?.current_period_end ?? 0).utc()
  }, [subscription])

  const currentBillingCycleSelected = useMemo(() => {
    // Selected by default
    if (!dateRange?.period_start || !dateRange?.period_end) return true

    return (
      dayjs(dateRange.period_start.date).isSame(billingCycleStart) &&
      dayjs(dateRange.period_end.date).isSame(billingCycleEnd)
    )
  }, [dateRange, billingCycleStart, billingCycleEnd])

  const startDate = useMemo(() => {
    // If end date is in future, set end date to now
    if (!dateRange?.period_start?.date) {
      return undefined
    } else {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      return new Date(dateRange?.period_start?.date).toISOString().slice(0, -5) + 'Z'
    }
  }, [dateRange, subscription])

  const endDate = useMemo(() => {
    // If end date is in future, set end date to end of current day
    if (dateRange?.period_end?.date && dayjs(dateRange.period_end.date).isAfter(dayjs())) {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      // In order to have full days from Prometheus metrics when using 1d interval,
      // the time needs to be greater or equal than the time of the start date
      return dayjs().endOf('day').toISOString().slice(0, -5) + 'Z'
    } else if (dateRange?.period_end?.date) {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      return new Date(dateRange.period_end.date).toISOString().slice(0, -5) + 'Z'
    }
  }, [dateRange, subscription])

  if (!canReadSubscriptions) {
    return (
      <ScaffoldContainerLegacy>
        <NoPermission resourceText="view organization usage" />
      </ScaffoldContainerLegacy>
    )
  }

  return (
    <>
      <ScaffoldContainerLegacy>
        <ScaffoldTitle>Usage</ScaffoldTitle>
      </ScaffoldContainerLegacy>
      <div className="sticky top-0 border-b bg-studio z-[1] overflow-hidden ">
        <ScaffoldContainer className="">
          <div className="py-4 flex items-center space-x-4">
            {isLoadingSubscription && <ShimmeringLoader className="w-[250px]" />}

            {isErrorSubscription && (
              <AlertError
                className="w-full"
                subject="Failed to retrieve usage data"
                error={subscriptionError}
              />
            )}

            {isSuccessSubscription && (
              <>
                <DateRangePicker
                  onChange={setDateRange}
                  value={TIME_PERIODS_BILLING[0].key}
                  options={[...TIME_PERIODS_BILLING, ...TIME_PERIODS_REPORTS]}
                  loading={isLoadingSubscription}
                  currentBillingPeriodStart={subscription?.current_period_start}
                  currentBillingPeriodEnd={subscription?.current_period_end}
                />

                <Listbox
                  size="tiny"
                  name="schema"
                  className="w-[180px]"
                  value={selectedProjectRef}
                  onChange={(value: any) => {
                    if (value === 'all-projects') setSelectedProjectRef(undefined)
                    else setSelectedProjectRef(value)
                  }}
                >
                  <Listbox.Option
                    key="all-projects"
                    id="all-projects"
                    label="All projects"
                    value="all-projects"
                  >
                    All projects
                  </Listbox.Option>
                  {orgProjects?.map((project) => (
                    <Listbox.Option
                      key={project.id}
                      id={project.id}
                      value={project.id}
                      label={project.name}
                    >
                      {project.name}
                    </Listbox.Option>
                  ))}
                </Listbox>

                <div className="flex flex-col xl:flex-row xl:gap-3">
                  <p className={cn('text-sm transition', isLoadingSubscription && 'opacity-50')}>
                    Organization is on the {subscription.plan.name} plan
                  </p>
                  <p className="text-sm text-foreground-light">
                    {billingCycleStart.format('DD MMM YYYY')} -{' '}
                    {billingCycleEnd.format('DD MMM YYYY')}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScaffoldContainer>
      </div>

      <TotalUsage
        orgSlug={orgRef!}
        projectRef={selectedProjectRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />

      {subscription?.plan.id !== 'free' && (
        <Compute
          orgSlug={orgRef!}
          projectRef={selectedProjectRef}
          subscription={subscription}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      <Egress
        orgSlug={orgRef!}
        projectRef={selectedProjectRef}
        branchRef={branchRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />

      <SizeAndCounts
        orgSlug={orgRef!}
        projectRef={selectedProjectRef}
        branchRef={branchRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />

      <Activity
        orgSlug={orgRef!}
        projectRef={selectedProjectRef}
        branchRef={branchRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />
    </>
  )
}

export default Usage
