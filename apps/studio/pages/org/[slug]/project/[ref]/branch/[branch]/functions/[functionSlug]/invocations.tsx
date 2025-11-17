import { useParams } from 'common'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef, functionSlug } = useParams()
  const { data: selectedFunction, isLoading } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })

  if (selectedFunction === undefined || isLoading) return null

  return (
    <div className="flex-1">
      <LogsPreviewer
        condensedLayout
        orgRef={orgRef!}
        projectRef={projectRef!}
        branchRef={branchRef!}
        queryType="fn_edge"
        filterOverride={{ function_id: selectedFunction.id }}
      />
    </div>
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout>{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default LogPage
