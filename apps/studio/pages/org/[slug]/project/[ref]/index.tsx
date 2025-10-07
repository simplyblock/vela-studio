import { useEffect } from 'react'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'
import { useRouter } from 'next/router'
import { useLastVisitedBranch } from 'data/branches/last-visited-branch'
import { cn } from '@ui/lib/utils'
import { PROJECT_STATUS } from 'lib/constants'
import Link from 'next/link'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { ServiceStatus } from 'components/interfaces/Home/ServiceStatus'
import { ProjectUpgradeFailedBanner } from 'components/ui/ProjectUpgradeFailedBanner'

const Home: NextPageWithLayout = () => {
  const { data: project, isLoading: isProjectLoading } = useSelectedProjectQuery()
  const { ref, slug } = useParams()
  const router = useRouter()

  const [lastVisitedProjectBranch] = useLastVisitedBranch(project)

  useEffect(() => {
    if (isProjectLoading) return

    if (!project) {
      router.push('/organizations')
    } else {
      router.replace(`/org/${slug}/project/${ref}/branch/${lastVisitedProjectBranch}`)
    }
  }, [router, project, isProjectLoading, lastVisitedProjectBranch, ref, slug])

  return (
    <div className="w-full px-4">
      <div className={cn('py-16 ')}>
        <div className="mx-auto max-w-7xl flex flex-col gap-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between w-full">
            <div className="flex flex-col md:flex-row md:items-end gap-3 w-full">
              <div>
                <h1 className="text-3xl">{project?.name}</h1>
              </div>
            </div>
            <div className="flex items-center">
              {project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && (
                <div className="flex items-center gap-x-6">
                  <div className="flex flex-col gap-y-1">
                    <Link
                      href={`/org/${slug}/project/${ref}/branch/${lastVisitedProjectBranch}/editor`}
                      className="transition text-foreground-light hover:text-foreground text-sm"
                    >
                      Tables
                    </Link>
                    <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                  </div>

                  <div className="flex flex-col gap-y-1">
                    <Link
                      href={`/org/${slug}/project/${ref}/branch/${lastVisitedProjectBranch}/functions`}
                      className="transition text-foreground-light hover:text-foreground text-sm"
                    >
                      Functions
                    </Link>
                    <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                  </div>

                  <div className="flex flex-col gap-y-1">
                    <Link
                      href={`/org/${slug}/project/${ref}/branch/${lastVisitedProjectBranch}/settings/infrastructure`}
                      className="transition text-foreground-light hover:text-foreground text-sm"
                    >
                      Replicas
                    </Link>
                    <ShimmeringLoader className="w-full h-[32px] w-6 p-0" />
                  </div>
                </div>
              )}
              {project?.status === PROJECT_STATUS.ACTIVE_HEALTHY && (
                <div className="ml-6 border-l flex items-center w-[145px] justify-end">
                  <ServiceStatus />
                </div>
              )}
            </div>
          </div>
          <ProjectUpgradeFailedBanner />
        </div>
      </div>
    </div>
  )
}

Home.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default Home
