import { isNull, partition } from 'lodash'
import { AlertCircle, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import InformationBox from 'components/ui/InformationBox'
import NoSearchResults from 'components/ui/NoSearchResults'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import ExtensionRow from './ExtensionRow'
import { HIDDEN_EXTENSIONS, SEARCH_TERMS } from './Extensions.constants'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const Extensions = () => {
  const { filter } = useParams()
  const { data: branch } = useSelectedBranchQuery()
  const [filterString, setFilterString] = useState<string>('')

  const { data, isLoading } = useDatabaseExtensionsQuery({
    branch,
  })

  const extensions =
    filterString.length === 0
      ? data ?? []
      : (data ?? []).filter((ext) => {
          const nameMatchesSearch = ext.name.toLowerCase().includes(filterString.toLowerCase())
          const searchTermsMatchesSearch = (SEARCH_TERMS[ext.name] || []).some((x) =>
            x.includes(filterString.toLowerCase())
          )
          return nameMatchesSearch || searchTermsMatchesSearch
        })
  const extensionsWithoutHidden = extensions.filter((ext) => !HIDDEN_EXTENSIONS.includes(ext.name))
  const [enabledExtensions, disabledExtensions] = partition(
    extensionsWithoutHidden,
    (ext) => !isNull(ext.installed_version)
  )
  const { can: canUpdateExtensions, isSuccess: isPermissionsLoaded } = useCheckPermissions("branch:settings:admin")

  useEffect(() => {
    if (filter !== undefined) setFilterString(filter as string)
  }, [filter])

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Input
            size="tiny"
            placeholder="Search for an extension"
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            className="w-52"
            icon={<Search size={14} />}
          />
        </div>
      </div>

      {isPermissionsLoaded && !canUpdateExtensions && (
        <InformationBox
          icon={<AlertCircle className="text-foreground-light" size={18} strokeWidth={2} />}
          title="You need additional permissions to update database extensions"
        />
      )}

      {isLoading ? (
        <GenericSkeletonLoader />
      ) : (
        <div className="w-full overflow-hidden overflow-x-auto">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="name">Name</TableHead>
                  <TableHead key="version">Version</TableHead>
                  <TableHead key="schema">Schema</TableHead>
                  <TableHead key="description">Description</TableHead>
                  <TableHead key="used-by">Used by</TableHead>
                  <TableHead key="links">Links</TableHead>
                  <TableHead
                    key="enabled"
                    className="w-20 bg-background-200 border-l sticky right-0"
                  >
                    Enabled
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...enabledExtensions, ...disabledExtensions].map((extension) => (
                  <ExtensionRow key={extension.name} extension={extension} />
                ))}
                {extensions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <NoSearchResults
                        className="border-none !p-0 bg-transparent"
                        searchString={filterString}
                        onResetFilter={() => setFilterString('')}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </>
  )
}

export default Extensions
