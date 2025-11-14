import { useState } from "react"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useParams } from "common"

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogSection,
  DialogSectionSeparator,
  DialogTrigger,
  Form_Shadcn_,
  FormField_Shadcn_,
  FormControl_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectContent_Shadcn_,
} from "ui"

import { FormItemLayout } from "ui-patterns/form/FormItemLayout/FormItemLayout"

import { 
  useOrganizationRoleCreateMutation 
} from "data/organizations/organization-role-create-mutation"

import type { RoleType } from "data/organizations/organization-role-create-mutation"


// Validation
const FormSchema = z.object({
  name: z.string().min(3, "Role name must be at least 3 characters"),
  roleType: z.enum(["organization", "project", "environment", "branch"]),
  description: z.string().optional()
})

export default function RoleCreateButton() {
  const { slug } = useParams()
  const [open, setOpen] = useState(false)

  const { mutate: createRole, isPending } = useOrganizationRoleCreateMutation()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      roleType: "organization",
      description: "",
    },
  })

  const onSubmit = (values: z.infer<typeof FormSchema>) => {
    if (!slug) return console.error("Missing slug")

    createRole(
      {
        slug,
        name: values.name,
        roleType: values.roleType as RoleType,
        description: values.description,
        permissions: [], // no permissions for now
      },
      {
        onSuccess: () => {
          toast.success("Role created successfully")
          setOpen(false)
          form.reset()
        },
        onError: (err: any) => {
          toast.error(err?.message ?? "Failed to create role")
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="primary">Create Role</Button>
      </DialogTrigger>

      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Create a new role</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form className="flex flex-col gap-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-4">

              {/* Role name */}
              <FormField_Shadcn_
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Role name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="Enter role name"
                        disabled={isPending}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              {/* Role type */}
              <FormField_Shadcn_
                name="roleType"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Role type">
                    <FormControl_Shadcn_>
                      <Select_Shadcn_
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger_Shadcn_ className="capitalize">
                          {field.value}
                        </SelectTrigger_Shadcn_>

                        <SelectContent_Shadcn_>
                          <SelectGroup_Shadcn_>
                            <SelectItem_Shadcn_ value="organization">Organization</SelectItem_Shadcn_>
                            <SelectItem_Shadcn_ value="project">Project</SelectItem_Shadcn_>
                            <SelectItem_Shadcn_ value="environment">Environment</SelectItem_Shadcn_>
                            <SelectItem_Shadcn_ value="branch">Branch</SelectItem_Shadcn_>
                          </SelectGroup_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              {/* Description */}
              <FormField_Shadcn_
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Description (optional)">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="Add an optional description..."
                        disabled={isPending}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>

            <DialogSectionSeparator />

            {/* Submit */}
            <DialogSection>
              <Button block htmlType="submit" loading={isPending}>
                Create role
              </Button>
            </DialogSection>

          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
