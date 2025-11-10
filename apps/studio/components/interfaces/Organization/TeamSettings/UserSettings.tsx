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