import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { Branch, useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useRouter } from 'next/router'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface EditBranchModalProps {
  branch?: Branch
  visible: boolean
  onClose: () => void
}

export const EditBranchModal = ({ branch, visible, onClose }: EditBranchModalProps) => {
  const { slug: orgSlug, ref } = useParams()
  const router = useRouter()
  const { data: projectDetails } = useSelectedProjectQuery()

  const isBranch = projectDetails?.parent_project_ref !== undefined
  const projectRef =
    projectDetails !== undefined ? (isBranch ? projectDetails.parent_project_ref : ref) : undefined

  const { data: branches } = useBranchesQuery({ orgSlug, projectRef })

  const { mutate: updateBranch, isLoading: isUpdating } = useBranchUpdateMutation({
    onSuccess: (data) => {
      toast.success(`Successfully updated branch "${data.name}"`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to update branch: ${error.message}`)
    },
  })

  const formId = 'edit-branch-form'
  const FormSchema = z
    .object({
      branchName: z
        .string()
        .min(1, 'Branch name cannot be empty')
        .refine(
          (val) => /^[a-zA-Z0-9\-_]+$/.test(val),
          'Branch name can only contain alphanumeric characters, hyphens, and underscores.'
        )
        .refine(
          (val) =>
            // Allow the current branch name during edit
            val === branch?.name || (branches ?? []).every((b) => b.name !== val),
          'A branch with this name already exists'
        ),
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: { branchName: '' },
  })

  const isFormValid = form.formState.isValid
  const canSubmit = isFormValid && !isUpdating

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!orgSlug) return console.error('Organization slug is required')
    if (!projectRef) return console.error('Project ref is required')
    if (!ref) return console.error('Branch ref is required')

    const payload: {
      orgSlug: string
      branchRef: string
      projectRef: string
      branch: string
    } = {
      orgSlug,
      branchRef: ref,
      projectRef,
      branch: data.branchName,
    }

    updateBranch(payload)
  }

  // Pre-fill form when the modal becomes visible and branch data is available
  useEffect(() => {
    if (visible && branch) {
      form.reset({
        branchName: branch.name ?? '',
      })
    }
  }, [branch, visible, form])

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="large" hideClose>
        <DialogHeader padding="small">
          <DialogTitle>Edit branch "{branch?.name}"</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection padding="medium" className="space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItemLayout label="Preview branch name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="e.g. staging, dev-feature-x"
                        autoComplete="off"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>

            <DialogFooter padding="medium">
              <Button disabled={isUpdating} type="default" onClick={onClose}>
                Cancel
              </Button>
              <Button
                form={formId}
                disabled={
                  isUpdating ||
                  !canSubmit
                }
                loading={isUpdating}
                type="primary"
                htmlType="submit"
              >
                Update branch
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}