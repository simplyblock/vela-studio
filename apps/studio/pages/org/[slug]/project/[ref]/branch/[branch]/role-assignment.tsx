'use client'

import { BranchRoleAssignment } from 'components/interfaces/Organization/TeamSettings/RBAC/RoleAssignment/BranchRoleAssignment'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { ScaffoldContainer, ScaffoldTitle } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const BranchRoleAssignmentPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer className='flex flex-col p-6 gap-y-3'>
      <ScaffoldTitle>Role Assignment</ScaffoldTitle>
      <BranchRoleAssignment />
    </ScaffoldContainer>
  )
}

BranchRoleAssignmentPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default BranchRoleAssignmentPage
