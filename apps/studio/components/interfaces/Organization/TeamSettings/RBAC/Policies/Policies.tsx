import { Search } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
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

interface Policy {
  id: string
  name: string
  description: string
  effect: 'Allow' | 'Deny'
  scope: string
}

const DEFAULT_POLICIES: Policy[] = [
  {
    id: 'policy-allow-members',
    name: 'Manage members',
    description: 'Permit organization members to invite, update, and remove users within their teams.',
    effect: 'Allow',
    scope: 'organization',
  },
  {
    id: 'policy-read-projects',
    name: 'Read projects',
    description: 'Allows the assigned role to view project metadata across the organization.',
    effect: 'Allow',
    scope: 'projects',
  },
  {
    id: 'policy-restrict-billing',
    name: 'Restrict billing updates',
    description: 'Prevents changes to billing details unless the subject role explicitly grants access.',
    effect: 'Deny',
    scope: 'billing',
  },
]

const PoliciesList = ({ searchString }: { searchString: string }) => {
  const normalizedQuery = searchString.trim().toLowerCase()
  const filteredPolicies = normalizedQuery
    ? DEFAULT_POLICIES.filter((policy) => {
        const value = `${policy.name} ${policy.description} ${policy.scope}`.toLowerCase()
        return value.includes(normalizedQuery)
      })
    : DEFAULT_POLICIES

  if (filteredPolicies.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-md border border-default bg-surface-100 p-6 text-sm text-foreground-lighter">
        No policies match your filter yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {filteredPolicies.map((policy) => (
        <div
          key={policy.id}
          className="flex flex-col gap-2 rounded-md border border-default bg-surface-100 p-4 text-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-foreground font-medium">{policy.name}</p>
              <p className="text-foreground-lighter mt-1 text-xs leading-relaxed">
                {policy.description}
              </p>
            </div>
            <span
              className={
                policy.effect === 'Allow'
                  ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600'
                  : 'rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'
              }
            >
              {policy.effect}
            </span>
          </div>
          <div className="text-foreground-lighter text-xs">
            Scope: <span className="text-foreground">{policy.scope}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export const Policies = () => {
  const [searchString, setSearchString] = useState('')

  return (
    <ScaffoldContainer>
      <ScaffoldTitle>Policies</ScaffoldTitle>
      <ScaffoldFilterAndContent>
        <ScaffoldActionsContainer className="w-full flex-col gap-2 justify-between md:flex-row">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={searchString}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchString(event.target.value)}
            name="policy-search"
            id="policy-search"
            placeholder="Filter policies"
          />
          <ScaffoldActionsGroup className="w-full md:w-auto">
            <DocsButton href="https://supabase.com/docs/guides/platform/access-control" />
          </ScaffoldActionsGroup>
        </ScaffoldActionsContainer>
        <ScaffoldSectionContent className="w-full">
          <PoliciesList searchString={searchString} />
        </ScaffoldSectionContent>
      </ScaffoldFilterAndContent>
    </ScaffoldContainer>
  )
}

export default Policies
