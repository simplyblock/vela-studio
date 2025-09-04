import { FileCode } from 'lucide-react'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import {
  Badge,
  cn,
  CodeBlock,
  CodeBlockLang,
  WarningIcon,
} from 'ui'
import { ConnectionParameters } from './ConnectionParameters'
import { DirectConnectionIcon, TransactionIcon } from './PoolerIcons'

interface ConnectionPanelProps {
  type?: 'direct' | 'transaction' | 'session'
  badge?: string
  title: string
  description: string
  connectionString: string
  notice?: string[]
  parameters?: Array<{
    key: string
    value: string
    description?: string
  }>
  contentType?: 'input' | 'code'
  lang?: CodeBlockLang
  fileTitle?: string
  onCopyCallback: () => void
}

export const CodeBlockFileHeader = ({ title }: { title: string }) => {
  return (
    <div className="flex items-center justify-between px-4 py-1 bg-surface-100/50 border border-b-0 border-surface rounded-t">
      <div className="flex items-center gap-2">
        <FileCode size={12} className="text-foreground-muted" strokeWidth={1.5} />
        <span className="text-xs text-foreground-light">{title}</span>
      </div>
    </div>
  )
}

export const ConnectionPanel = ({
  type = 'direct',
  badge,
  title,
  description,
  connectionString,
  notice,
  parameters = [],
  lang = 'bash',
  fileTitle,
  children,
  onCopyCallback,
}: PropsWithChildren<ConnectionPanelProps>) => {
  const { slug, ref: projectRef } = useParams()

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-20 w-full">
      <div className="flex flex-col">
        <div className="flex items-center gap-x-2 mb-2">
          <h1 className="text-sm">{title}</h1>
          {!!badge && <Badge>{badge}</Badge>}
        </div>
        <p className="text-sm text-foreground-light mb-4">{description}</p>
        <div className="flex flex-col -space-y-px">
          {fileTitle && <CodeBlockFileHeader title={fileTitle} />}
          <CodeBlock
            wrapperClassName={cn(
              '[&_pre]:rounded-b-none [&_pre]:px-4 [&_pre]:py-3',
              fileTitle && '[&_pre]:rounded-t-none'
            )}
            language={lang}
            value={connectionString}
            className="[&_code]:text-[12px] [&_code]:text-foreground"
            hideLineNumbers
            onCopyCallback={onCopyCallback}
          />
          {notice && (
            <div className="border px-4 py-1 w-full justify-start rounded-t-none !last:rounded-b group-data-[state=open]:rounded-b-none border-light">
              {notice?.map((text: string) => (
                <p key={text} className="text-xs text-foreground-lighter">
                  {text}
                </p>
              ))}
            </div>
          )}
          {parameters.length > 0 && <ConnectionParameters parameters={parameters} />}
          {children}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="flex flex-col -space-y-px w-full">
          {type !== 'session' && (
            <>
              <div className="relative border border-muted px-5 flex items-center gap-3 py-3 first:rounded-t last:rounded-b h-[58px]">
                <div className="absolute top-2 left-2.5">
                  {type === 'transaction' ? <TransactionIcon /> : <DirectConnectionIcon />}
                </div>
                <div className="flex flex-col pl-[52px]">
                  <span className="text-xs text-foreground">
                    {type === 'transaction'
                      ? 'Suitable for a large number of connected clients'
                      : 'Suitable for long-lived, persistent connections'}
                  </span>
                </div>
              </div>
              <div className="border border-muted px-5 flex items-center gap-3 py-3 first:rounded-t last:rounded-b h-[58px]">
                <div className="flex flex-col pl-[52px]">
                  <span className="text-xs text-foreground">
                    {type === 'transaction'
                      ? 'Pre-warmed connection pool to Postgres'
                      : 'Each client has a dedicated connection to Postgres'}
                  </span>
                </div>
              </div>
            </>
          )}

          {type === 'session' && (
            <div className="border border-muted px-5 flex gap-7 items-center py-3 first:rounded-t last:rounded-b bg-alternative/50">
              <div className="flex w-6 h-6 rounded items-center justify-center gap-2 flex-shrink-0 bg-surface-100">
                <WarningIcon />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-foreground">Only use on a IPv4 network</span>
                <span className="text-xs text-foreground-lighter">
                  Use Direct Connection if connecting via an IPv6 network
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
