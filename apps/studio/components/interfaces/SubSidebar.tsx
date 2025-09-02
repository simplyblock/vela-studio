// components/interfaces/SubSideBar/SubSideBar.tsx
import { useRouter } from 'next/router'
import Link from 'next/link'
import { cn } from 'ui'
import {
  Users,
  Shield,
  UserCog,
  FileText,
  LogIn,
  Mail,
  Lock,
  Link as LinkIcon,
  // Add more icons as needed
  Icon as LucideIcon,
} from 'lucide-react'

interface SubSideBarItem {
  label: string
  href: string
  icon?: typeof LucideIcon
}

interface SubSideBarSection {
  title?: string
  items: SubSideBarItem[]
}

interface SubSideBarProps {
  title: string
  sections: SubSideBarSection[]
  className?: string
}

export const SubSideBar = ({ title, sections, className }: SubSideBarProps) => {
  const router = useRouter()

  return (
    <div className={cn('w-64 border-r bg-surface-100 border-default', className)}>
      <div className="px-6 py-4 border-b border-default">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>

      <nav className="p-2 space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {/* Section Title (if provided) */}
            {section.title && (
              <h3 className="px-3 mb-2 text-xs font-medium text-foreground-light uppercase tracking-wider">
                {section.title}
              </h3>
            )}

            {/* Section Items */}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = router.asPath === item.href
                const IconComponent = item.icon

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-4 py-2 text-sm rounded-md transition-colors gap-3',
                        isActive
                          ? 'bg-selection text-foreground font-medium'
                          : 'text-foreground-light hover:text-foreground hover:bg-surface-200'
                      )}
                    >
                      {IconComponent && (
                        // @ts-ignore
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
