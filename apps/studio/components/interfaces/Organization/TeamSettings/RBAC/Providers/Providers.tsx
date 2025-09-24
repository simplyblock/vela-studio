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

interface Provider {
  id: string
  name: string
  description: string
  status: 'Enabled' | 'Disabled'
  category: 'OAuth' | 'Enterprise' | 'Password'
}

const AUTH_PROVIDERS: Provider[] = [
  {
    id: 'google-oauth',
    name: 'Google',
    description: 'Let organization members authenticate through their Google Workspace or personal Google accounts.',
    status: 'Enabled',
    category: 'OAuth',
  },
  {
    id: 'github-oauth',
    name: 'GitHub',
    description: 'Allow developers to sign in using their GitHub identities for streamlined project access.',
    status: 'Disabled',
    category: 'OAuth',
  },
]

const ProvidersList = ({ searchString }: { searchString: string }) => {
  const normalizedQuery = searchString.trim().toLowerCase()
  const filteredProviders = normalizedQuery
    ? AUTH_PROVIDERS.filter((provider) => {
        const searchValue = `${provider.name} ${provider.description} ${provider.category}`.toLowerCase()
        return searchValue.includes(normalizedQuery)
      })
    : AUTH_PROVIDERS

  if (filteredProviders.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-md border border-default bg-surface-100 p-6 text-sm text-foreground-lighter">
        No providers match your filter yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {filteredProviders.map((provider) => (
        <div
          key={provider.id}
          className="flex flex-col gap-2 rounded-md border border-default bg-surface-100 p-4 text-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-foreground font-medium">{provider.name}</p>
              <p className="text-foreground-lighter mt-1 text-xs leading-relaxed">
                {provider.description}
              </p>
            </div>
            <span
              className={
                provider.status === 'Enabled'
                  ? 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600'
                  : 'rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning'
              }
            >
              {provider.status}
            </span>
          </div>
          <div className="text-foreground-lighter text-xs">
            Category: <span className="text-foreground">{provider.category}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export const Providers = () => {
  const [searchString, setSearchString] = useState('')

  return (
    <ScaffoldContainer>
      <ScaffoldTitle>Sign-in providers</ScaffoldTitle>
      <ScaffoldFilterAndContent>
        <ScaffoldActionsContainer className="w-full flex-col gap-2 justify-between md:flex-row">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={searchString}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchString(event.target.value)}
            name="provider-search"
            id="provider-search"
            placeholder="Filter providers"
          />
          <ScaffoldActionsGroup className="w-full md:w-auto">
            <DocsButton href="https://supabase.com/docs/guides/auth/social-login" />
          </ScaffoldActionsGroup>
        </ScaffoldActionsContainer>
        <ScaffoldSectionContent className="w-full">
          <ProvidersList searchString={searchString} />
        </ScaffoldSectionContent>
      </ScaffoldFilterAndContent>
    </ScaffoldContainer>
  )
}

export default Providers
