import { PropsWithChildren } from 'react'
import { withAuth } from 'hooks/misc/withAuth'

const WideWizardLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="flex w-full flex-col">
      <div className="overflow-auto">
        <section
          className="
            has-slide-in slide-in
            relative
            w-full
            max-w-none
            px-6
            py-10
            lg:px-12
            xl:px-16
          "
        >
          {children}
        </section>
      </div>
    </div>
  )
}

export default withAuth(WideWizardLayout)
export const WideWizardLayoutWithoutAuth = WideWizardLayout
