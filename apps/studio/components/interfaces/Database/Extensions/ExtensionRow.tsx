import { AlertTriangle, Book, Github, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseExtensionDisableMutation } from 'data/database-extensions/database-extension-disable-mutation'
import { DatabaseExtension } from 'data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { extensions } from 'shared-data'
import { Button, Switch, Tooltip, TooltipContent, TooltipTrigger, TableRow, TableCell } from 'ui'
import { Admonition } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import EnableExtensionModal from './EnableExtensionModal'
import { EXTENSION_DISABLE_WARNINGS } from './Extensions.constants'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

interface ExtensionRowProps {
  extension: DatabaseExtension
}

const ExtensionRow = ({ extension }: ExtensionRowProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()
  const isOn = extension.installed_version !== null

  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false)
  const [showConfirmEnableModal, setShowConfirmEnableModal] = useState(false)
  // FIXME: need permission implemented 
  const { can: canUpdateExtensions } = {can:true}
  const disabled = !canUpdateExtensions

  const extensionMeta = extensions.find((item) => item.name === extension.name)
  const docsUrl = extensionMeta?.link.startsWith('/guides')
    ? `https://supabase.com/docs${extensionMeta?.link}`
    : extensionMeta?.link ?? undefined

  const { mutate: disableExtension, isLoading: isDisabling } = useDatabaseExtensionDisableMutation({
    onSuccess: () => {
      toast.success(`${extension.name} is off.`)
      setIsDisableModalOpen(false)
    },
  })

  const onConfirmDisable = () => {
    if (branch === undefined) return console.error('Branch is required')

    disableExtension({
      branch,
      id: extension.name,
    })
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-x-2">
            <span title={extension.name} className="truncate inline-block max-w-48">
              {extension.name}
            </span>
            {extensionMeta?.deprecated && extensionMeta?.deprecated.length > 0 && (
              <ButtonTooltip
                type="warning"
                icon={<AlertTriangle />}
                className="rounded-full"
                tooltip={{
                  content: {
                    text: `The extension is deprecated and will be removed in ${extensionMeta.deprecated.join(', ')}.`,
                  },
                }}
              >
                Deprecated
              </ButtonTooltip>
            )}
          </div>
        </TableCell>

        <TableCell className="font-mono tracking-tighter">
          {extension?.installed_version ?? extension.default_version}
        </TableCell>

        <TableCell className="truncate">{isOn ? extension.schema : '-'}</TableCell>

        <TableCell className="text-foreground-light">
          <p className="block max-w-96" title={extension.comment ?? undefined}>
            {extension.comment}
          </p>
        </TableCell>

        <TableCell>
          {extensionMeta?.product ? (
            <div className="flex flex-col gap-1">
              {extensionMeta.product_url ? (
                <Link
                  href={extensionMeta.product_url.replace('{ref}', project?.ref ?? '')}
                  className="transition hover:text-foreground"
                >
                  {extensionMeta.product}
                </Link>
              ) : (
                <span>{extensionMeta.product}</span>
              )}
              {!isOn && (
                <span className="text-foreground-lighter text-xs">
                  Install extension to use {extensionMeta.product}
                </span>
              )}
            </div>
          ) : (
            <span className="text-foreground-lighter">-</span>
          )}
        </TableCell>

        <TableCell className="flex gap-2 items-center">
          {extensionMeta?.github_url && (
            <Button asChild type="default" icon={<Github />} className="rounded-full">
              <a
                target="_blank"
                rel="noreferrer"
                href={extensionMeta.github_url}
                className="font-mono tracking-tighter"
              >
                {extensionMeta.github_url.split('/').slice(-2).join('/')}
              </a>
            </Button>
          )}
          {docsUrl !== undefined && (
            <Button asChild type="default" icon={<Book />} className="rounded-full">
              <a
                target="_blank"
                rel="noreferrer"
                className="font-mono tracking-tighter"
                href={docsUrl}
              >
                Docs
              </a>
            </Button>
          )}
        </TableCell>

        <TableCell className="w-20 sticky bg-surface-100 border-l right-0">
          {isDisabling ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch
                  disabled={disabled}
                  checked={isOn}
                  onCheckedChange={() =>
                    isOn ? setIsDisableModalOpen(true) : setShowConfirmEnableModal(true)
                  }
                />
              </TooltipTrigger>
              {disabled && (
                <TooltipContent side="bottom">
                  {!canUpdateExtensions
                    ? 'You need additional permissions to toggle extensions'
                    : null}
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </TableCell>
      </TableRow>

      <EnableExtensionModal
        visible={showConfirmEnableModal}
        extension={extension}
        onCancel={() => setShowConfirmEnableModal(false)}
      />

      <ConfirmationModal
        visible={isDisableModalOpen}
        title="Confirm to disable extension"
        confirmLabel="Disable"
        variant="destructive"
        confirmLabelLoading="Disabling"
        onCancel={() => setIsDisableModalOpen(false)}
        onConfirm={() => onConfirmDisable()}
      >
        <div className="flex flex-col gap-y-3">
          <p className="text-sm text-foreground-light">
            Are you sure you want to turn OFF the "{extension.name}" extension?
          </p>
          {EXTENSION_DISABLE_WARNINGS[extension.name] && (
            <Admonition type="warning" className="m-0">
              {EXTENSION_DISABLE_WARNINGS[extension.name]}
            </Admonition>
          )}
        </div>
      </ConfirmationModal>
    </>
  )
}

export default ExtensionRow
