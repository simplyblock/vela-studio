import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  ScaffoldDescription,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers/Shimmers'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  cn,
  Modal,
  ScrollArea,
  WarningIcon,
} from 'ui'
import { AddNewURLModal } from './AddNewURLModal'
import { RedirectUrlList } from './RedirectUrlList'
import { ValueContainer } from './ValueContainer'
import { useAuthClientQuery } from 'data/auth/auth-client-query'
import { useAuthClientUpdateMutation } from 'data/auth/auth-client-update-mutation'
import { ResponseError } from 'types'

export const RedirectUrls = () => {
  const { slug: orgId, ref: projectId, branch: branchId } = useParams()

  const {
    data: client,
    error: clientError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthClientQuery({ orgId, projectId, branchId })
  const { mutate: updateAuthClient, isLoading: isUpdatingConfig } = useAuthClientUpdateMutation()

  const URI_ALLOW_LIST_ARRAY = useMemo(() => {
    return client?.redirectUris || []
  }, [client])

  const [open, setOpen] = useState(false)
  const [openRemoveSelected, setOpenRemoveSelected] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])

  const onSaveAddUrl = async (
    newUrls: string[],
    onError: (error: ResponseError) => void,
    onSuccess: () => void
  ) => {
    if (!newUrls || newUrls.length === 0) return
    if (!orgId) return
    if (!projectId) return
    if (!branchId) return

    const urlList = [...URI_ALLOW_LIST_ARRAY, ...newUrls]
    const payload = [...new Set(urlList.map((url) => url))]
    updateAuthClient(
      {
        orgId,
        projectId,
        branchId,
        client: {
          ...client,
          redirectUris: payload,
        },
      }, {
        onError,
        onSuccess,
      }
    )
  }

  const onConfirmDeleteUrl = async (urls?: string[]) => {
    if (!urls || urls.length === 0) return
    if (!orgId) return
    if (!projectId) return
    if (!branchId) return

    // Remove selectedUrl from array and update
    const payload = URI_ALLOW_LIST_ARRAY.filter((url: string) => !selectedUrls.includes(url))
    updateAuthClient(
      {
        orgId,
        projectId,
        branchId,
        client: {
          ...client,
          redirectUris: payload,
        },
      },
      {
        onError: (error) => {
          toast.error(`Failed to remove URL(s): ${error?.message}`)
        },
        onSuccess: () => {
          setSelectedUrls([])
          setOpenRemoveSelected(false)
          toast.success('Successfully removed URL(s)')
        },
      }
    )
  }

  return (
    <ScaffoldSection isFullWidth>
      <div className="flex items-center justify-between mb-6">
        <div>
          <ScaffoldSectionTitle>Redirect URLs</ScaffoldSectionTitle>
          <ScaffoldDescription>
            URLs that auth providers are permitted to redirect to post authentication. Wildcards are
            allowed, for example, https://*.domain.com
          </ScaffoldDescription>
        </div>
        <DocsButton href="https://supabase.com/docs/guides/auth/concepts/redirect-urls" />
      </div>

      {isLoading && (
        <>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
        </>
      )}

      {isError && (
        <Alert_Shadcn_ variant="destructive">
          <WarningIcon />
          <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>{clientError.message}</AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}

      {isSuccess && (
        <RedirectUrlList
          allowList={URI_ALLOW_LIST_ARRAY}
          selectedUrls={selectedUrls}
          onSelectUrl={setSelectedUrls}
          onSelectAddURL={() => setOpen(true)}
          onSelectClearSelection={() => setSelectedUrls([])}
          onSelectRemoveURLs={() => setOpenRemoveSelected(true)}
        />
      )}

      <AddNewURLModal
        visible={open}
        allowList={URI_ALLOW_LIST_ARRAY}
        onSave={onSaveAddUrl}
        isSaving={isUpdatingConfig}
        onClose={() => setOpen(false)}
      />

      <Modal
        hideFooter
        size="large"
        visible={openRemoveSelected}
        header="Remove URLs"
        onCancel={() => {
          setSelectedUrls([])
          setOpenRemoveSelected(false)
        }}
      >
        <Modal.Content className="flex flex-col gap-y-2">
          <p className="mb-2 text-sm text-foreground-light">
            Are you sure you want to remove the following {selectedUrls.length} URL
            {selectedUrls.length > 1 ? 's' : ''}?
          </p>
          <ScrollArea className={cn(selectedUrls.length > 4 ? 'h-[250px]' : '')}>
            <div className="flex flex-col -space-y-1">
              {selectedUrls.map((url) => {
                return (
                  <ValueContainer key={url} className="px-4 py-3 hover:bg-surface-100">
                    {url}
                  </ValueContainer>
                )
              })}
            </div>
          </ScrollArea>
          <p className="text-foreground-light text-sm">
            These URLs will no longer work with your authentication configuration.
          </p>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex items-center gap-x-2">
          <Button
            block
            type="default"
            size="medium"
            onClick={() => {
              setSelectedUrls([])
              setOpenRemoveSelected(false)
            }}
          >
            Cancel
          </Button>
          <Button
            block
            size="medium"
            type="warning"
            loading={isUpdatingConfig}
            onClick={() => onConfirmDeleteUrl(selectedUrls)}
          >
            {isUpdatingConfig ? 'Removing...' : 'Remove URL'}
          </Button>
        </Modal.Content>
      </Modal>
    </ScaffoldSection>
  )
}
