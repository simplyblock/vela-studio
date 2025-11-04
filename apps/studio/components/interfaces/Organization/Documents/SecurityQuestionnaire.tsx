import { Download } from 'lucide-react'
import { toast } from 'sonner'

import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { getDocument } from 'data/documents/document-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export const SecurityQuestionnaire = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.id
  const { mutate: sendEvent } = useSendEventMutation()

  const { can: canReadSubscriptions } = useCheckPermissions('branch:settings:read')

  const fetchQuestionnaire = async (orgSlug: string) => {
    try {
      const questionnaireLink = await getDocument({
        orgRef: orgSlug,
        docType: 'standard-security-questionnaire',
      })
      if (questionnaireLink?.fileUrl) window.open(questionnaireLink.fileUrl, '_blank')
    } catch (error: any) {
      toast.error(`Failed to download Security Questionnaire: ${error.message}`)
    }
  }

  return (
    <>
      <ScaffoldSection>
        <ScaffoldSectionDetail className="sticky space-y-6 top-12">
          <p className="text-base m-0">Standard Security Questionnaire</p>
          <div className="space-y-2 text-sm text-foreground-light m-0">
            <p>
              Organizations on Team Plan or above have access to our standard security
              questionnaire.
            </p>
          </div>
        </ScaffoldSectionDetail>
        <ScaffoldSectionContent>
          {!canReadSubscriptions ? (
            <NoPermission resourceText="access our security questionnaire" />
          ) : (
            <>
              <div className="flex items-center justify-center h-full">
                <Button
                  type="default"
                  icon={<Download />}
                  onClick={() => {
                    sendEvent({
                      action: 'document_view_button_clicked',
                      properties: { documentName: 'Standard Security Questionnaire' },
                      groups: { organization: organization?.id ?? 'Unknown' },
                    })
                    if (slug) fetchQuestionnaire(slug)
                  }}
                >
                  Download Questionnaire
                </Button>
              </div>
            </>
          )}
        </ScaffoldSectionContent>
      </ScaffoldSection>
    </>
  )
}
