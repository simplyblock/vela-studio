// components/interfaces/SubSideBar/RbacSubSideBar.tsx
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { SubSideBar } from './SubSidebar'
import { 
  Users, 
  Shield, 
  UserCog, 
  FileText, 
  LogIn, 
  Mail, 
  Lock, 
  Link as LinkIcon 
} from 'lucide-react'

export const RbacSubSideBar = () => {
  const organization = useSelectedOrganizationQuery()
  const orgSlug = organization.data?.slug

  const sections = [
    {
      title: 'Manage',
      items: [
        {
          label: 'Users',
          href: `/org/${orgSlug}/team`,
          icon: Users,
        },
        {
          label: 'Roles',
          href: `/org/${orgSlug}/team/roles`,
          icon: Shield,
        },
        {
          label: 'Role Assignment',
          href: `/org/${orgSlug}/team/roleAssignment`,
          icon: UserCog,
        },
      ]
    },
    {
      title: 'Configuration',
      items: [
        {
          label: 'Policies',
          href: `/org/${orgSlug}/team/policies`,
          icon: FileText,
        },
        {
          label: 'Sign In / Providers',
          href: `/org/${orgSlug}/providers`,
          icon: LogIn,
        },
        {
          label: 'Emails',
          href: `/org/${orgSlug}/team/emails`,
          icon: Mail,
        },
        {
          label: 'Multi-Factor',
          href: `/org/${orgSlug}/team/multiFactor`,
          icon: Lock,
        },
        {
          label: 'URL Configuration',
          href: `/org/${orgSlug}/team/urlConfig`,
          icon: LinkIcon,
        },
      ]
    }
  ]

  return <SubSideBar title="Access control" sections={sections} />
}