import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { getContentById } from 'data/content/content-id-query'
import {
  UpsertContentPayload,
  useContentUpsertMutation,
} from 'data/content/content-upsert-mutation'
import { Snippet } from 'data/content/sql-folders-query'
import type { SqlSnippet } from 'data/content/sql-snippets-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import { Button, Form, Input, Modal } from 'ui'
import { subscriptionHasHipaaAddon } from '../Billing/Subscription/Subscription.utils'
import { getPathReferences } from '../../../data/vela/path-references'

export interface RenameQueryModalProps {
  snippet?: SqlSnippet | Snippet
  visible: boolean
  onCancel: () => void
  onComplete: () => void
}

const RenameQueryModal = ({
  snippet = {} as any,
  visible,
  onCancel,
  onComplete,
}: RenameQueryModalProps) => {
  const { slug: orgSlug, ref } = getPathReferences()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabsSnap = useTabsStateSnapshot()
  const { data: subscription } = useOrgSubscriptionQuery(
    { orgSlug: orgSlug },
    { enabled: visible }
  )
  const { data: projectSettings } = useProjectSettingsV2Query({ orgSlug, projectRef: ref })

  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription) && projectSettings?.is_sensitive

  const { id, name, description } = snippet

  const [nameInput, setNameInput] = useState(name)
  const [descriptionInput, setDescriptionInput] = useState(description)

  const validate = () => {
    const errors: any = {}
    if (!nameInput) errors.name = 'Please enter a query name'
    return errors
  }

  const { mutateAsync: upsertContent } = useContentUpsertMutation()

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    if (!ref) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')

    setSubmitting(true)
    try {
      let localSnippet = snippet

      // [Joshen] For SQL V2 - content is loaded on demand so we need to fetch the data if its not already loaded in the valtio state
      if (!('content' in localSnippet)) {
        localSnippet = await getContentById({ projectRef: ref, id })
        snapV2.addSnippet({ projectRef: ref, snippet: localSnippet })
      }

      await upsertContent({
        projectRef: ref,
        payload: {
          ...localSnippet,
          name: nameInput,
          description: descriptionInput,
        } as UpsertContentPayload,
      })

      snapV2.renameSnippet({ id, name: nameInput, description: descriptionInput })

      const tabId = createTabId('sql', { id })
      tabsSnap.updateTab(tabId, { label: nameInput })

      toast.success('Successfully renamed snippet!')
      if (onComplete) onComplete()
    } catch (error: any) {
      setSubmitting(false)
      // [Joshen] We probably need some rollback cause all the saving is async
      toast.error(`Failed to rename snippet: ${error.message}`)
    }
  }

  useEffect(() => {
    setNameInput(name)
    setDescriptionInput(description)
  }, [snippet.id])

  return (
    <Modal visible={visible} onCancel={onCancel} hideFooter header="Rename" size="small">
      <Form
        onReset={onCancel}
        validateOnBlur
        initialValues={{
          name: name ?? '',
          description: description ?? '',
        }}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ isSubmitting }: { isSubmitting: boolean }) => (
          <>
            <Modal.Content className="space-y-4">
              <Input
                label="Name"
                id="name"
                name="name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              <Input.TextArea
                label="Description"
                id="description"
                placeholder="Describe query"
                size="medium"
                textAreaClassName="resize-none"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
              />
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content className="flex items-center justify-end gap-2">
              <Button htmlType="reset" type="default" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                Rename query
              </Button>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}

export default RenameQueryModal
