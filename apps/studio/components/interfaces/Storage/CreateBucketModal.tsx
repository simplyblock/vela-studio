import { zodResolver } from '@hookform/resolvers/zod'
import { Edit } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { inverseValidBucketNameRegex, validBucketNameRegex } from './CreateBucketModal.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const FormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Please provide a name for your bucket')
      .max(100, 'Bucket name should be below 100 characters')
      .refine(
        (value) => !value.endsWith(' '),
        'The name of the bucket cannot end with a whitespace'
      )
      .refine(
        (value) => value !== 'public',
        '"public" is a reserved name. Please choose another name'
      ),
    public: z.boolean().default(false),
    has_file_size_limit: z.boolean().default(false),
    formatted_size_limit: z.coerce
      .number()
      .min(0, 'File size upload limit has to be at least 0')
      .default(0),
  })
  .superRefine((data, ctx) => {
    if (!validBucketNameRegex.test(data.name)) {
      const [match] = data.name.match(inverseValidBucketNameRegex) ?? []
      ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: !!match
          ? `Bucket name cannot contain the "${match}" character`
          : 'Bucket name contains an invalid special character',
      })
    }
  })

const formId = 'create-storage-bucket-form'

export type CreateBucketForm = z.infer<typeof FormSchema>

const CreateBucketModal = () => {
  const [visible, setVisible] = useState(false)
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const router = useRouter()

  const { can: canCreateBuckets } = useCheckPermissions('branch:settings:admin')

  const { mutateAsync: createBucket, isLoading: isCreating } = useBucketCreateMutation({
    // [Joshen] Silencing the error here as it's being handled in onSubmit
    onError: () => {},
  })

  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      public: false,
      has_file_size_limit: false,
      formatted_size_limit: 0,
    },
  })

  const isPublicBucket = form.watch('public')

  const onSubmit: SubmitHandler<CreateBucketForm> = async (values) => {
    if (!orgRef) return console.error('Org ref is required')
    if (!projectRef) return console.error('Project ref is required')
    if (!branchRef) return console.error('Branch ref is required')

    try {
      await createBucket({
        orgRef,
        projectRef,
        branchRef,
        id: values.name,
        isPublic: values.public,
      })
      form.reset()
      setVisible(false)
      toast.success(`Successfully created bucket ${values.name}`)
      router.push(
        `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/storage/buckets/${values.name}`
      )
    } catch (error) {
      console.error(error)
      toast.error('Failed to create bucket')
    }
  }

  const handleClose = () => {
    form.reset()
    setVisible(false)
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogTrigger asChild>
        <ButtonTooltip
          block
          type="default"
          icon={<Edit />}
          disabled={!canCreateBuckets}
          style={{ justifyContent: 'start' }}
          onClick={() => setVisible(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateBuckets
                ? 'You need additional permissions to create buckets'
                : undefined,
            },
          }}
        >
          New bucket
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create storage bucket</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="name"
                    label="Name of bucket"
                    labelOptional="Buckets cannot be renamed once created."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ id="name" {...field} placeholder="Enter bucket name" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <DialogSectionSeparator />

              <FormField_Shadcn_
                key="public"
                name="public"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="public"
                    label="Public bucket"
                    description="Anyone can read any object without any authorization"
                    layout="flex"
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        id="public"
                        size="large"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              {isPublicBucket && (
                <Admonition
                  type="warning"
                  className="rounded-none border-x-0 border-b-0 mb-0 pb-0 px-0 [&>svg]:left-0 [&>div>p]:!leading-normal"
                  title="Public buckets are not protected"
                  description={
                    <>
                      <p className="mb-2">
                        Users can read objects in public buckets without any authorization.
                      </p>
                      <p>
                        Row level security (RLS) policies are still required for other operations
                        such as object uploads and deletes.
                      </p>
                    </>
                  }
                />
              )}
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isCreating} onClick={() => setVisible(false)}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isCreating} disabled={isCreating}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateBucketModal
