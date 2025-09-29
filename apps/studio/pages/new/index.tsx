import { useState } from 'react'

import { NewOrgForm } from 'components/interfaces/Organization'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import WizardLayout from 'components/layouts/WizardLayout'
import { SetupIntentResponse, useSetupIntent } from 'data/stripe/setup-intent-mutation'
import type { NextPageWithLayout } from 'types'

/**
 * No org selected yet, create a new one
 */
const Wizard: NextPageWithLayout = () => {
  const [intent, setIntent] = useState<SetupIntentResponse>()

  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const { mutate: setupIntent } = useSetupIntent({ onSuccess: (res) => setIntent(res) })

  const initSetupIntent = async (hcaptchaToken: string | undefined) => {
    // Force a reload of Elements, necessary for Stripe
    // Also mitigates card testing to some extent as we generate a new captcha token
    setIntent(undefined)
    setupIntent({})
  }

  const resetSetupIntent = () => {
    setIntent(undefined)
  }

  const onLocalCancel = () => {
    setIntent(undefined)
  }

  return (
    <>
      <NewOrgForm
        setupIntent={intent}
        onPaymentMethodReset={() => resetSetupIntent()}
        onPlanSelected={(plan) => setSelectedPlan(plan)}
      />
    </>
  )
}

Wizard.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="New organization">
      <WizardLayout>{page}</WizardLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Wizard
