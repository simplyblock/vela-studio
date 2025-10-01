import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { StringNumberOrNull } from 'components/ui/Forms/Form.constants'
import NoPermission from 'components/ui/NoPermission'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const FormSchema = z.object({
  API_MAX_REQUEST_DURATION: z.coerce
    .number()
    .min(5, 'Must be 5 or larger')
    .max(30, 'Must be a value no greater than 30'),
  DB_MAX_POOL_SIZE: StringNumberOrNull,
})

export const AdvancedAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
    // FIXME: need permission implemented
  const { can: canReadConfig } = {can:true}
    // FIXME: need permission implemented 
  const { can: canUpdateConfig } = {can:true}

  const [isUpdatingRequestDurationForm, setIsUpdatingRequestDurationForm] = useState(false)
  const [isUpdatingDatabaseForm, setIsUpdatingDatabaseForm] = useState(false)

  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation()

  const requestDurationForm = useForm({
    resolver: zodResolver(
      z.object({
        API_MAX_REQUEST_DURATION: FormSchema.shape.API_MAX_REQUEST_DURATION,
      })
    ),
    defaultValues: {
      API_MAX_REQUEST_DURATION: 10,
    },
  })

  const databaseForm = useForm({
    resolver: zodResolver(
      z.object({
        DB_MAX_POOL_SIZE: FormSchema.shape.DB_MAX_POOL_SIZE,
      })
    ),
    defaultValues: {
      DB_MAX_POOL_SIZE: '',
    },
  })

  useEffect(() => {
    if (authConfig) {
      if (!isUpdatingRequestDurationForm) {
        requestDurationForm.reset({
          API_MAX_REQUEST_DURATION: authConfig?.API_MAX_REQUEST_DURATION ?? 10,
        })
      }

      if (!isUpdatingDatabaseForm) {
        databaseForm.reset({
          DB_MAX_POOL_SIZE:
            authConfig?.DB_MAX_POOL_SIZE !== null ? String(authConfig?.DB_MAX_POOL_SIZE) : '',
        })
      }
    }
  }, [authConfig, isUpdatingRequestDurationForm, isUpdatingDatabaseForm])

  const onSubmitRequestDurationForm = (values: any) => {
    if (!projectRef) return console.error('Project ref is required')

    setIsUpdatingRequestDurationForm(true)

    updateAuthConfig(
      { projectRef: projectRef, config: values },
      {
        onError: (error) => {
          toast.error(`Failed to update request duration settings: ${error?.message}`)
          setIsUpdatingRequestDurationForm(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated request duration settings')
          setIsUpdatingRequestDurationForm(false)
        },
      }
    )
  }

  const onSubmitDatabaseForm = (values: any) => {
    if (!projectRef) return console.error('Project ref is required')

    setIsUpdatingDatabaseForm(true)

    const config = {
      DB_MAX_POOL_SIZE: values.DB_MAX_POOL_SIZE,
    }

    updateAuthConfig(
      { projectRef: projectRef, config },
      {
        onError: (error) => {
          toast.error(`Failed to update database connection settings: ${error?.message}`)
          setIsUpdatingDatabaseForm(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated database connection settings')
          setIsUpdatingDatabaseForm(false)
        },
      }
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  if (!canReadConfig) {
    return <NoPermission resourceText="view auth configuration settings" />
  }

  return (
    <>
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">Request Duration</ScaffoldSectionTitle>

        <Form_Shadcn_ {...requestDurationForm}>
          <form
            onSubmit={requestDurationForm.handleSubmit(onSubmitRequestDurationForm)}
            className="space-y-4"
          >
            <Card>
              <CardContent className="pt-6">
                <FormField_Shadcn_
                  control={requestDurationForm.control}
                  name="API_MAX_REQUEST_DURATION"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Maximum time allowed for an Auth request to last"
                      description="Number of seconds to wait for an Auth request to complete before canceling it. In certain high-load situations setting a larger or smaller value can be used to control load-shedding. Recommended: 10 seconds."
                    >
                      <FormControl_Shadcn_>
                        <div className="relative">
                          <PrePostTab postTab="seconds">
                            <Input_Shadcn_
                              type="number"
                              min={5}
                              max={30}
                              {...field}
                              disabled={!canUpdateConfig}
                            />
                          </PrePostTab>
                        </div>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardFooter className="justify-end space-x-2">
                {requestDurationForm.formState.isDirty && (
                  <Button type="default" onClick={() => requestDurationForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !canUpdateConfig ||
                    isUpdatingRequestDurationForm ||
                    !requestDurationForm.formState.isDirty
                  }
                  loading={isUpdatingRequestDurationForm}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </ScaffoldSection>

      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">Auth Database Connections</ScaffoldSectionTitle>

        <Form_Shadcn_ {...databaseForm}>
          <form onSubmit={databaseForm.handleSubmit(onSubmitDatabaseForm)} className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <FormField_Shadcn_
                  control={databaseForm.control}
                  name="DB_MAX_POOL_SIZE"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Max Direct Auth Connections"
                      description="Auth will take up no more than this number of connections from the total number of available connections to serve requests. These connections are not reserved, so when unused they are released. Defaults to 10 connections."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          type="number"
                          placeholder="10"
                          {...field}
                          disabled={!canUpdateConfig}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardFooter className="justify-end space-x-2">
                {databaseForm.formState.isDirty && (
                  <Button type="default" onClick={() => databaseForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !canUpdateConfig || isUpdatingDatabaseForm || !databaseForm.formState.isDirty
                  }
                  loading={isUpdatingDatabaseForm}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </ScaffoldSection>
    </>
  )
}
