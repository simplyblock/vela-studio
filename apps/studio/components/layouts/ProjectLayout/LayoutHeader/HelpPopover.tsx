import { HelpCircle, MessageCircle } from 'lucide-react'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import SVG from 'react-inlinesvg'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

export const HelpPopover = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <ButtonTooltip
          id="help-popover-button"
          type="text"
          className="rounded-none w-[32px] h-[30px] group"
          icon={
            <HelpCircle
              size={18}
              strokeWidth={1.5}
              className="!h-[18px] !w-[18px] text-foreground-light group-hover:text-foreground"
            />
          }
          tooltip={{ content: { side: 'bottom', text: 'Help' } }}
          onClick={() => {
            sendEvent({
              action: 'help_button_clicked',
              groups: { project: project?.id, organization: org?.id },
            })
          }}
        />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[400px] space-y-4 p-0 py-5" align="end" side="bottom">
        <div className="mb-5 px-5">
          <h5 className="text-foreground mb-2">Need help with your project?</h5>
          <p className="text-sm text-foreground-lighter">
            For issues with your project hosted on supabase.com or other hosted service inquiries.
            Response times are based on your billing plan, with paid plans prioritized.
          </p>
        </div>
        <div className="mb-4 space-y-2">
          <div className="mb-4 px-5">
            <h5 className="mb-2">Reach out to the community</h5>

            <p className="text-sm text-foreground-lighter">
              For other support, including questions on our client libraries, advice, or best
              practices.
            </p>
          </div>
          <div className="px-5">
            <div
              className="relative space-y-2 overflow-hidden rounded px-5 py-4 pb-12 shadow-md"
              style={{ background: '#404EED' }}
            >
              <a
                href="https://discord.supabase.com"
                target="_blank"
                rel="noreferrer"
                className="dark block cursor-pointer"
              >
                <Image
                  className="absolute left-0 top-0 opacity-50"
                  src={`${router.basePath}/img/support/discord-bg-small.jpg`}
                  layout="fill"
                  objectFit="cover"
                  alt="discord illustration header"
                />
                <Button
                  type="secondary"
                  icon={<SVG src={`${router.basePath}/img/discord-icon.svg`} className="h-4 w-4" />}
                >
                  <span style={{ color: '#404EED' }}>Join Discord server</span>
                </Button>
              </a>
            </div>
          </div>
          <div className="px-5">
            <div className="relative space-y-2 overflow-hidden rounded px-5 py-4 pb-12 shadow-md">
              <a
                href="https://github.com/supabase/supabase/discussions"
                target="_blank"
                rel="noreferrer"
                className="block cursor-pointer"
              >
                <Image
                  className="absolute left-0 top-0 opacity-50"
                  src={`${router.basePath}/img/support/github-bg.jpg?v-1`}
                  layout="fill"
                  objectFit="cover"
                  alt="discord illustration header"
                />
                <Button type="secondary" icon={<MessageCircle />}>
                  GitHub Discussions
                </Button>
              </a>
            </div>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
