import { MoreHorizontal, Pencil, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import CardButton from 'components/ui/CardButton'
import Panel from 'components/ui/Panel'
import { useDeleteLogDrainMutation } from 'data/log-drains/delete-log-drain-mutation'
import { LogDrainData, useLogDrainsQuery } from 'data/log-drains/log-drains-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { LOG_DRAIN_TYPES, LogDrainType } from './LogDrains.constants'

export function LogDrains({
  onNewDrainClick,
  onUpdateDrainClick,
}: {
  onNewDrainClick: (src: LogDrainType) => void
  onUpdateDrainClick: (drain: LogDrainData) => void
}) {
  const { data: org } = useSelectedOrganizationQuery()

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedLogDrain, setSelectedLogDrain] = useState<LogDrainData | null>(null)
  const { ref } = useParams()
  const {
    data: logDrains,
    isLoading,
    refetch,
    error,
    isError,
  } = useLogDrainsQuery(
    { ref },
    {
      enabled: true,
    }
  )
  const { mutate: deleteLogDrain } = useDeleteLogDrainMutation({
    onSuccess: () => {
      setIsDeleteModalOpen(false)
      setSelectedLogDrain(null)
    },
    onError: () => {
      setIsDeleteModalOpen(false)
      setSelectedLogDrain(null)
      toast.error('Failed to delete log drain')
    },
  })

  if (!isLoading && logDrains?.length === 0) {
    return (
      <div className="grid lg:grid-cols-2 gap-3">
        {LOG_DRAIN_TYPES.map((src) => (
          <CardButton
            key={src.value}
            title={src.name}
            description={src.description}
            icon={src.icon}
            onClick={() => {
              onNewDrainClick(src.value)
            }}
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return <AlertError error={error}></AlertError>
  }

  return (
    <>
      <Panel className="">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-[200px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Destination</TableHead>
              <TableHead className="text-right">
                <div className="sr-only">Actions</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logDrains?.map((drain) => (
              <TableRow key={drain.id}>
                <TableCell className="font-medium truncate max-w-72" title={drain.name}>
                  {drain.name}
                </TableCell>
                <TableCell
                  className="text-foreground-light truncate max-w-72"
                  title={drain.description}
                >
                  {drain.description}
                </TableCell>
                <TableCell className="text-right font-mono">{drain.type}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="text"
                        className="px-1 opacity-50 hover:opacity-100 !bg-transparent"
                        icon={<MoreHorizontal />}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-w-[140px]" align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          onUpdateDrainClick(drain)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Update
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedLogDrain(drain)
                          setIsDeleteModalOpen(true)
                        }}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <ConfirmationModal
            confirmLabel="Delete"
            variant="destructive"
            title="Delete Log Drain"
            visible={isDeleteModalOpen}
            onConfirm={() => {
              if (selectedLogDrain && ref) {
                deleteLogDrain({ token: selectedLogDrain.token, projectRef: ref })
              }
            }}
            onCancel={() => setIsDeleteModalOpen(false)}
          >
            <div className="text-foreground-light text-sm">
              <p>
                Are you sure you want to delete{' '}
                <span className="text-foreground">{selectedLogDrain?.name}</span>?
              </p>
              <p>This action cannot be undone.</p>
            </div>
          </ConfirmationModal>
        </Table>
      </Panel>
    </>
  )
}
