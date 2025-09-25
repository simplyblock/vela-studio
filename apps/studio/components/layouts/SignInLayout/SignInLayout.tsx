import { useFlag } from 'hooks/ui/useFlag'
import { PropsWithChildren } from 'react'

type SignInLayoutProps = {
  heading: string
  subheading: string
}

const SignInLayout = ({
  heading,
  subheading,
  children,
}: PropsWithChildren<SignInLayoutProps>) => {
  const ongoingIncident = useFlag('ongoingIncident')

  return (
    <>
      <div className="relative flex flex-col bg-alternative min-h-screen">
        <div
          className={`absolute top-0 w-full px-8 mx-auto sm:px-6 lg:px-8 ${
            ongoingIncident ? 'mt-14' : 'mt-6'
          }`}
        >
          <nav className="relative flex items-center justify-between sm:h-10">
          </nav>
        </div>

        <div className="flex flex-1 h-full justify-center">
          <main className="flex flex-col items-center flex-1 flex-shrink-0 px-5 pt-16 pb-8 max-w-md">
            <div className="flex-1 flex flex-col justify-center w-[330px] sm:w-[384px]">
              <div className="mb-10">
                <h1 className="mt-8 mb-2 lg:text-3xl">{heading}</h1>
                <h2 className="text-sm text-foreground-light">{subheading}</h2>
              </div>

              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default SignInLayout
