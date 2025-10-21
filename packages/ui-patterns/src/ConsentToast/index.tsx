'use client'

import { useBreakpoint } from 'common'
import { noop } from 'lodash'
import { Button } from 'ui'

interface ConsentToastProps {
  onAccept: () => void
  onOptOut: () => void
}

export const ConsentToast = ({ onAccept = noop, onOptOut = noop }: ConsentToastProps) => {
  const isMobile = useBreakpoint(639)

  return (
    <div className="py-1 flex flex-col gap-y-3 w-full">
      <div>
        <p className="text-sm text-foreground">
          We use cookies to collect data and improve our services.{' '}
          <a
            target="_blank"
            rel="noreferrer noopener"
            href="https://supabase.com/privacy#8-cookies-and-similar-technologies-used-on-our-european-services"
            className="hidden sm:inline underline underline-offset-2 decoration-foreground-lighter hover:decoration-foreground-light transition-all"
          >
            Learn more
          </a>{' '}
        </p>
        <div className="flex items-center justify-start gap-x-2 sm:hidden">
          <a
            target="_blank"
            rel="noreferrer noopener"
            href="https://supabase.com/privacy#8-cookies-and-similar-technologies-used-on-our-european-services"
            className="underline underline-offset-2 text-foreground-light hover:decoration-foreground-light transition-all"
          >
            Learn more
          </a>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          type="default"
          onClick={onAccept}
          size={isMobile ? 'small' : 'tiny'}
          block={isMobile}
        >
          Accept
        </Button>
        <Button
          type={isMobile ? 'outline' : 'text'}
          onClick={onOptOut}
          size={isMobile ? 'small' : 'tiny'}
          block={isMobile}
        >
          Opt out
        </Button>
      </div>
    </div>
  )
}
