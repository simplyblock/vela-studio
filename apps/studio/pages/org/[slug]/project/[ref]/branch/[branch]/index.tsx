import Link from 'next/link'
import { useMemo } from 'react'

import { useParams } from 'common'
import { ClientLibrary, ExampleProject } from 'components/interfaces/Home'
import { AdvisorWidget } from 'components/interfaces/Home/AdvisorWidget'
import { CLIENT_LIBRARIES, EXAMPLE_PROJECTS } from 'components/interfaces/Home/Home.constants'
import { ProjectUsageSection } from 'components/interfaces/Home/ProjectUsageSection'
import { ServiceStatus } from 'components/interfaces/Home/ServiceStatus'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectPausedState } from 'components/layouts/ProjectLayout/PausedState/ProjectPausedState'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { cn, Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

const Home: NextPageWithLayout = () => {
  const { data: project } = useSelectedBranchQuery()
  const { data: branch } = useSelectedBranchQuery()
  const { ref, slug, branch: branchRef } = useParams()

  const {
    projectHomepageShowAllClientLibraries: showAllClientLibraries,
    projectHomepageShowInstanceSize: showInstanceSize,
    projectHomepageShowExamples: showExamples,
  } = useIsFeatureEnabled([
    'project_homepage:show_all_client_libraries',
    'project_homepage:show_instance_size',
    'project_homepage:show_examples',
  ])

  const clientLibraries = useMemo(() => {
    if (showAllClientLibraries) {
      return CLIENT_LIBRARIES
    }
    return CLIENT_LIBRARIES.filter((library) => library.language === 'JavaScript')
  }, [showAllClientLibraries])

  const isPaused = branch?.status === "PAUSED"

  const { data: tablesData, isLoading: isLoadingTables } = useTablesQuery({
    branch,
    schema: 'public',
  })
  const { data: functionsData, isLoading: isLoadingFunctions } = useEdgeFunctionsQuery({
    orgRef: slug,
    projectRef: project?.id,
  })
  const { data: replicasData, isLoading: isLoadingReplicas } = useReadReplicasQuery({
    branch,
  })

  let branchName = 'Welcome to your branch'
  if (branch?.name) {
    branchName = branch?.name
  }

  const tablesCount = Math.max(0, tablesData?.length ?? 0)
  const functionsCount = Math.max(0, functionsData?.length ?? 0)
  // [Joshen] JFYI minus 1 as the replicas endpoint returns the primary DB minimally
  const replicasCount = Math.max(0, (replicasData?.length ?? 1) - 1)

  return (
    <div className="w-full px-4">
      <div className={cn('py-16 ', !isPaused && 'border-b border-muted ')}>
        <div className="mx-auto max-w-7xl flex flex-col gap-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between w-full">
            <div className="flex flex-col md:flex-row md:items-end gap-3 w-full">
              <div>
                <h1 className="text-3xl">{branchName}</h1>
              </div>
            </div>
            <div className="flex items-center">
              {project?.status === PROJECT_STATUS.STARTED && (
                <div className="flex items-center gap-x-6">
                  <div className="flex flex-col gap-y-1">
                    <Link
                      href={`/org/${slug}/project/${ref}/branch/${branchRef}/editor`}
                      className="transition text-foreground-light hover:text-foreground text-sm"
                    >
                      Tables
                    </Link>

                    {isLoadingTables ? (
                      <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                    ) : (
                      <p className="text-2xl tabular-nums">{tablesCount}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-y-1">
                    <Link
                      href={`/org/${slug}/project/${ref}/branch/${branchRef}/functions`}
                      className="transition text-foreground-light hover:text-foreground text-sm"
                    >
                      Functions
                    </Link>
                    {isLoadingFunctions ? (
                      <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                    ) : (
                      <p className="text-2xl tabular-nums">{functionsCount}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-y-1">
                    <Link
                      href={`/org/${slug}/project/${ref}/branch/${branchRef}/settings/infrastructure`}
                      className="transition text-foreground-light hover:text-foreground text-sm"
                    >
                      Replicas
                    </Link>
                    {isLoadingReplicas ? (
                      <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                    ) : (
                      <p className="text-2xl tabular-nums">{replicasCount}</p>
                    )}
                  </div>
                </div>
              )}
              {project?.status === PROJECT_STATUS.STARTED && (
                <div className="ml-6 border-l flex items-center w-[145px] justify-end">
                  <ServiceStatus />
                </div>
              )}
            </div>
          </div>
          <ProjectUpgradeFailedBanner />
          {isPaused && <ProjectPausedState />}
        </div>
      </div>

      {!isPaused && (
        <>
          <div className="py-16 border-b border-muted">
            <div className="mx-auto max-w-7xl space-y-16">
              {project?.status !== PROJECT_STATUS.PAUSED && <ProjectUsageSection />}
              {project?.status !== PROJECT_STATUS.PAUSED && <AdvisorWidget />}
            </div>
          </div>

          <div className="bg-surface-100/5 py-16">
            <div className="mx-auto max-w-7xl space-y-16">
              {project?.status !== PROJECT_STATUS.PAUSED && (
                <>
                  <div className="space-y-8">
                    <h2 className="text-lg">Client libraries</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:gap-12 mb-12 md:grid-cols-3">
                      {clientLibraries.map((library) => (
                        <ClientLibrary key={library.language} {...library} />
                      ))}
                    </div>
                  </div>
                  {showExamples && (
                    <div className="space-y-8">
                      <h4 className="text-lg">Example projects</h4>
                      <div className="flex justify-center">
                        <Tabs_Shadcn_ defaultValue="app" className="w-full">
                          <TabsList_Shadcn_ className="flex gap-4 mb-8">
                            <TabsTrigger_Shadcn_ value="app">App Frameworks</TabsTrigger_Shadcn_>
                            <TabsTrigger_Shadcn_ value="mobile">
                              Mobile Frameworks
                            </TabsTrigger_Shadcn_>
                          </TabsList_Shadcn_>
                          <TabsContent_Shadcn_ value="app">
                            <div className="grid gap-2 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                              {EXAMPLE_PROJECTS.filter((project) => project.type === 'app')
                                .sort((a, b) => a.title.localeCompare(b.title))
                                .map((project) => (
                                  <ExampleProject key={project.url} {...project} />
                                ))}
                            </div>
                          </TabsContent_Shadcn_>
                          <TabsContent_Shadcn_ value="mobile">
                            <div className="grid gap-2 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                              {EXAMPLE_PROJECTS.filter((project) => project.type === 'mobile')
                                .sort((a, b) => a.title.localeCompare(b.title))
                                .map((project) => (
                                  <ExampleProject key={project.url} {...project} />
                                ))}
                            </div>
                          </TabsContent_Shadcn_>
                        </Tabs_Shadcn_>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

Home.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default Home
