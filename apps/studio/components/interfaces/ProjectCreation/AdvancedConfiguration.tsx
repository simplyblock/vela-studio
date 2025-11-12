import { ChevronRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import Panel from 'components/ui/Panel'
import { CreateProjectForm } from 'pages/new/[slug]'
import {
  Badge,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface AdvancedConfigurationProps {
  form: UseFormReturn<CreateProjectForm>
  layout?: 'vertical' | 'horizontal'
  collapsible?: boolean
}

export const AdvancedConfiguration = ({
  form,
  layout = 'horizontal',
  collapsible = true,
}: AdvancedConfigurationProps) => {
  const content = (
    <>
      <p className="text-xs text-foreground-lighter mt-3">
        These settings cannot be changed after the project is created
      </p>
    </>
  )

  const collapsibleContent = (
    <Collapsible_Shadcn_>
      <CollapsibleTrigger_Shadcn_ className="group/advanced-trigger font-mono uppercase tracking-widest text-xs flex items-center gap-1 text-foreground-lighter/75 hover:text-foreground-light transition data-[state=open]:text-foreground-light">
        Advanced Configuration
        <ChevronRight
          size={16}
          strokeWidth={1}
          className="mr-2 group-data-[state=open]/advanced-trigger:rotate-90 group-hover/advanced-trigger:text-foreground-light transition"
        />
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_
        className={cn(
          'pt-5 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'
        )}
      >
        {content}
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )

  return <Panel.Content>{collapsible ? collapsibleContent : content}</Panel.Content>
}
