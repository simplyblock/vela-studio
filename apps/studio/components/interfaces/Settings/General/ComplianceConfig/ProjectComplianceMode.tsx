import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { InlineLink } from 'components/ui/InlineLink'
import { useComplianceConfigUpdateMutation } from 'data/config/project-compliance-config-mutation'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Switch, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

const ComplianceConfig = () => {
  const { slug, ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isSensitive, setIsSensitive] = useState(false)
  // FIXME: need permission implemented 
  const { can: canUpdateComplianceConfig } = {can:true}

  const {
    data: settings,
    error,
    isError,
    isLoading,
    isSuccess,
  } = useProjectSettingsV2Query({ orgSlug: slug, projectRef: ref })
  const initialIsSensitive = settings?.is_sensitive || false

  const { mutate: updateComplianceConfig, isLoading: isSubmitting } =
    useComplianceConfigUpdateMutation({
      onSuccess: () => {
        toast.success('Successfully updated project compliance configuration')
      },
      onError: (error) => {
        setIsSensitive(initialIsSensitive)
        toast.error(`Failed to update project compliance configuration: ${error.message}`)
      },
    })

  const toggleIsSensitive = async () => {
    if (!slug) return console.error('Organization slug is required')
    if (!ref) return console.error('Project ref is required')
    setIsSensitive(!isSensitive)
    updateComplianceConfig({ orgSlug: slug, projectRef: ref, isSensitive: !isSensitive })
  }

  useEffect(() => {
    if (!isLoading) setIsSensitive(initialIsSensitive)
  }, [isLoading])

  return (
    <div id="compliance-configuration">
      <div className="flex items-center justify-between mb-6">
        <FormHeader
          className="mb-0"
          title="High Compliance Configuration"
          description="For projects storing and processing sensitive data (HIPAA)"
        />
        <DocsButton href="https://supabase.com/docs/guides/platform/hipaa-projects" />
      </div>
      <FormPanel>
        <FormSection
          header={
            <FormSectionLabel
              className="lg:col-span-9"
              description={
                <p className="text-sm text-foreground-light">
                  Enable security warnings in the{' '}
                  <InlineLink href={`/org/${slug}/project/${ref}/advisors/security`}>
                    Security Advisor
                  </InlineLink>{' '}
                  to enforce requirements for managing sensitive data
                </p>
              }
            >
              Apply additional compliance controls to project
            </FormSectionLabel>
          }
        >
          <FormSectionContent loading={false} className="lg:!col-span-3">
            <div className="flex items-center justify-end mt-2.5 space-x-2">
              {(isLoading || isSubmitting) && (
                <Loader2 className="animate-spin" strokeWidth={1.5} size={16} />
              )}
              {isError && (
                <AlertError error={error} subject="Failed to retrieve project settings" />
              )}
              {isSuccess && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* [Joshen] Added div as tooltip is messing with data state property of toggle */}
                    <div>
                      <Switch
                        size="large"
                        checked={isSensitive}
                        disabled={isLoading || isSubmitting || !canUpdateComplianceConfig}
                        onCheckedChange={toggleIsSensitive}
                      />
                    </div>
                  </TooltipTrigger>
                  {!canUpdateComplianceConfig && (
                    <TooltipContent side="bottom" className="w-64 text-center">
                      You need additional permissions to update the compliance configuration for
                      your project
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </FormSectionContent>
        </FormSection>
      </FormPanel>
    </div>
  )
}

export default ComplianceConfig
