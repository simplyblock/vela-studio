import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { NextPageWithLayout } from 'types'

const ProjectSettings: NextPageWithLayout = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams() as { ref: string, slug: string, branch: string }

  return (
    <ProductEmptyState title="Authentication settings have moved">
      <div className="text-sm">
        <p className="text-foreground-light mb-4">
          All settings are now under configuration within the Authentication page.
        </p>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/providers`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          General user signup
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/providers`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Password settings in email provider
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/sessions`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          User sessions
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/sessions`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Refresh tokens
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/protection`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Bot and abuse protection
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/smtp`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          SMTP settings
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/jwt`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Access token expiry
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/mfa`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Multifactor authentication
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/third-party`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Third party authentication
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/advanced`}
          className="py-2 hover:text-foreground border-b flex items-center justify-between"
        >
          Max request duration
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
        <Link
          href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/advanced`}
          className="py-2 hover:text-foreground flex items-center justify-between"
        >
          Max direct database connections
          <ChevronRight strokeWidth={1.5} size={16} />
        </Link>
      </div>
    </ProductEmptyState>
  )
}

ProjectSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Authentication">{page}</SettingsLayout>
  </DefaultLayout>
)

export default ProjectSettings
