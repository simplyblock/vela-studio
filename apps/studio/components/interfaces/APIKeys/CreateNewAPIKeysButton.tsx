import { useState } from 'react'

import { useAPIKeyCreateMutation } from 'data/api-keys/api-key-create-mutation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from 'ui'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

export const CreateNewAPIKeysButton = () => {
  const { data: branch } = useSelectedBranchQuery()
  const [createKeysDialogOpen, setCreateKeysDialogOpen] = useState(false)
  const [isCreatingKeys, setIsCreatingKeys] = useState(false)

  const { mutate: createAPIKey } = useAPIKeyCreateMutation()

  const handleCreateNewApiKeys = async () => {
    if (!branch) return
    setIsCreatingKeys(true)

    try {
      // Create publishable key
      await createAPIKey({
        branch,
        type: 'publishable',
        name: 'default',
      })

      // Create secret key
      await createAPIKey({
        branch,
        type: 'secret',
        name: 'default',
      })

      setCreateKeysDialogOpen(false)
    } catch (error) {
      console.error('Failed to create API keys:', error)
    } finally {
      setIsCreatingKeys(false)
    }
  }

  return (
    <AlertDialog open={createKeysDialogOpen} onOpenChange={setCreateKeysDialogOpen}>
      <Button onClick={() => setCreateKeysDialogOpen(true)}>Create new API keys</Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create new API keys</AlertDialogTitle>
          <AlertDialogDescription>
            This will create a default publishable key and a default secret key named{' '}
            <code>default</code>. These keys are required to connect your application to your
            Supabase project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreateNewApiKeys} disabled={isCreatingKeys}>
            {isCreatingKeys ? 'Creating...' : 'Create keys'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
