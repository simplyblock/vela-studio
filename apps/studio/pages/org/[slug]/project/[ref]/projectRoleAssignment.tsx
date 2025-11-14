import DefaultLayout from 'components/layouts/DefaultLayout'
import { NextPageWithLayout } from 'types'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { ProjectRoleAssignment } from 'components/interfaces/Organization/TeamSettings/RBAC/RoleAssignment/ProjectRoleAssignment'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'

const ProjectRoleAssignmentPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer className='w-full p-2'>
      <div className="space-y-6 p-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Project-level role assignment</h1>
          <p className="text-sm text-foreground-light">
            Assign project, environment, and branch roles to members for specific scopes.
          </p>
        </div>

        
      </div>
      <div className='w-full p-2'>
        <ProjectRoleAssignment />
      </div>
    </ScaffoldContainer>
  )
}

ProjectRoleAssignmentPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default ProjectRoleAssignmentPage
