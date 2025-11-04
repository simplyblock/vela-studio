import Link from 'next/link'
import { SetStateAction } from 'react'
import { toast } from 'sonner'
import { useProjectDiskResizeMutation } from 'data/config/project-disk-resize-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  InfoIcon,
  Modal,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

export interface DiskSizeConfigurationProps {
  visible: boolean
  hideModal: (value: SetStateAction<boolean>) => void
  loading: boolean
}

const DiskSizeConfigurationModal = ({
  visible,
  loading,
  hideModal,
}: DiskSizeConfigurationProps) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: project, isLoading: isLoadingProject } = useSelectedProjectQuery()

  const isLoading = isLoadingProject

  const { mutate: updateProjectUsage, isLoading: isUpdatingDiskSize } =
    useProjectDiskResizeMutation({
      onSuccess: (res, variables) => {
        toast.success(`Successfully updated disk size to ${variables.volumeSize} GB`)
        hideModal(false)
      },
    })

  return (
    <Modal
      header="Increase Disk Storage Size"
      size="medium"
      visible={visible}
      loading={loading}
      onCancel={() => hideModal(false)}
      hideFooter
    >
      {isLoading ? (
        <div className="flex flex-col gap-4 p-4">
          <ShimmeringLoader />
          <ShimmeringLoader />
        </div>
      ) : (
        <Alert_Shadcn_ className="border-none">
          <InfoIcon />
          <AlertTitle_Shadcn_>
            Disk size configuration is only available when the spend cap has been disabled
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              If you are intending to use more than 8GB of disk space, then you will need to
              disable your spend cap.
            </p>
            <Button asChild type="default" className="mt-3">
              <Link
                href={`/org/${organization?.id}/billing?panel=costControl`}
                target="_blank"
              >
                Disable spend cap
              </Link>
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
    </Modal>
  )
}

export default DiskSizeConfigurationModal
