// components/interfaces/SubSideBar/RbacSubSideBar.tsx
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { SubSideBar } from './SubSidebar'
import { Users, Shield, UserCog, FileText, LogIn, Mail, Lock, Link as LinkIcon } from 'lucide-react'

export const RbacSubSideBar = () => {
  const organization = useSelectedOrganizationQuery()
  const orgSlug = organization.data?.slug

  const sections = [
    {
      title: 'Manage',
      items: [
        {
          label: 'Users',
          href: `/org/${orgSlug}/rbac`,
          icon: Users,
        },
        {
          label: 'Roles',
          href: `/org/${orgSlug}/rbac/roles`,
          icon: Shield,
        },
        {
          label: 'Role Assignment',
          href: `/org/${orgSlug}/rbac/roleAssignment`,
          icon: UserCog,
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          label: 'Policies',
          href: `/org/${orgSlug}/rbac/policies`,
          icon: FileText,
        },
        {
          label: 'Sign In / Providers',
          href: `/org/${orgSlug}/rbac/providers`,
          icon: LogIn,
        },
        {
          label: 'Emails',
          href: `/org/${orgSlug}/rbac/emails`,
          icon: Mail,
        },
        {
          label: 'Multi-Factor',
          href: `/org/${orgSlug}/rbac/multiFactor`,
          icon: Lock,
        },
        {
          label: 'URL Configuration',
          href: `/org/${orgSlug}/rbac/urlConfig`,
          icon: LinkIcon,
        },
      ],
    },
  ]

  return <SubSideBar title="Access control" sections={sections} />
}
