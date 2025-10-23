import { Search } from 'lucide-react'
import { useState } from 'react'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainer,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { Input } from 'ui-patterns/DataInputs/Input'
import { InviteMemberButton } from './InviteMemberButton'
import MembersView from './MembersView'
import CreateBranchModal from 'components/interfaces/Branch/CreateBranchModal'
import CreateProjectModal from 'components/interfaces/Branch/CreateProjectModal'
import ResizeBranchModal from 'components/interfaces/Branch/ResizeBranchModal'
import BackupScheduleModal from 'components/interfaces/Organization/Backups/BackupScheduleModal'

export const UserSettings = () => {
  const [searchString, setSearchString] = useState('')

  return (
    <ScaffoldContainer>
      <ScaffoldTitle>Users</ScaffoldTitle>
      <ScaffoldFilterAndContent>
        <ScaffoldActionsContainer className="w-full flex-col md:flex-row gap-2 justify-between">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={searchString}
            onChange={(e: any) => setSearchString(e.target.value)}
            name="email"
            id="email"
            placeholder="Filter members"
          />
          <ScaffoldActionsGroup className="w-full md:w-auto">
            <DocsButton href="https://supabase.com/docs/guides/platform/access-control" />
            <InviteMemberButton />
          </ScaffoldActionsGroup>
        </ScaffoldActionsContainer>
        <ScaffoldSectionContent className="w-full">
          <MembersView searchString={searchString} />
        </ScaffoldSectionContent>
      </ScaffoldFilterAndContent>
    </ScaffoldContainer>
  )
}