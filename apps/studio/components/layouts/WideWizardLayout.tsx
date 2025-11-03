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
            mx-auto
            max-w-5xl      
            px-4 py-6     
            sm:px-6 sm:py-8
            lg:px-8 lg:py-10
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
