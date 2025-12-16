import { Box, Check, ChevronDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { ProjectInfo, useProjectsQuery } from 'data/projects/projects-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { Organization } from 'types'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const ProjectLink = ({
  project,
  setOpen,
}: {
  project: ProjectInfo
  organization?: Organization
  setOpen: (value: boolean) => void
}) => {
  const router = useRouter()
  const { ref, slug } = useParams()

  const href = `/org/${slug}/project/${project.id}`

  return (
    <CommandItem_Shadcn_
      key={project.id}
      value={`${project.name.replaceAll('"', '')}-${project.id}`}
      className="cursor-pointer w-full"
      onSelect={() => {
        router.push(href)
        setOpen(false)
      }}
      onClick={() => setOpen(false)}
    >
      <Link href={href} className="w-full flex items-center justify-between">
        {project.name}
        {project.id === ref && <Check size={16} />}
      </Link>
    </CommandItem_Shadcn_>
  )
}

export const ProjectDropdown = () => {
  const router = useRouter()
  const { slug } = useParams()
  const { data: project, isLoading: isLoadingProject } = useSelectedProjectQuery()
  const { data: allProjects, isLoading: isLoadingProjects } = useProjectsQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const { can: projectCreationEnabled, isLoading: isPermissionsLoading,isSuccess: isPermissionsSuccess } = useCheckPermissions('org:projects:create')
  // const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const projects = allProjects
    ?.filter((x) => x.organization_id === selectedOrganization?.id)
    .sort((a, b) => a.name.localeCompare(b.name))

  const [open, setOpen] = useState(false)

  if (isLoadingProjects || !project || isLoadingProject) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return (
    <>
      <Link
        href={`/org/${slug}/project/${project?.id}`}
        className="flex items-center gap-2 flex-shrink-0 text-sm"
      >
        <Box size={14} strokeWidth={1.5} className="text-foreground-lighter" />
        <span className="text-foreground max-w-32 lg:max-w-none truncate">{project?.name}</span>
      </Link>

      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="text"
            size="tiny"
            className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
            iconRight={<ChevronDown strokeWidth={1.5} />}
          />
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Find project..." />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No projects found</CommandEmpty_Shadcn_>

              {/* 1) LIST */}
              <CommandGroup_Shadcn_>
                <ScrollArea className={(projects || []).length > 7 ? 'h-[210px]' : ''}>
                  {projects?.map((project) => (
                    <ProjectLink key={project.id} project={project} setOpen={setOpen} />
                  ))}
                </ScrollArea>
              </CommandGroup_Shadcn_>

              {/* 2) NEW PROJECT (optional) */}
              {projectCreationEnabled && isPermissionsSuccess && (
                <>
                  <CommandSeparator_Shadcn_ />
                  <CommandGroup_Shadcn_>
                    <CommandItem_Shadcn_
                      className="cursor-pointer w-full"
                      onSelect={() => {
                        setOpen(false)
                        router.push(`/new/${selectedOrganization?.id}`)
                      }}
                      onClick={() => setOpen(false)}
                    >
                      <Link
                        href={`/new/${selectedOrganization?.id}`}
                        onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-2"
                      >
                        <Plus size={14} strokeWidth={1.5} />
                        <p>New project</p>
                      </Link>
                    </CommandItem_Shadcn_>
                  </CommandGroup_Shadcn_>
                </>
              )}

              {/* 3) ALL PROJECTS */}
              <CommandSeparator_Shadcn_ />
              <CommandGroup_Shadcn_>
                <CommandItem_Shadcn_
                  className="cursor-pointer w-full"
                  onSelect={() => {
                    setOpen(false)
                    router.push(`/org/${selectedOrganization?.id}`)
                  }}
                  onClick={() => setOpen(false)}
                >
                  <Link
                    href={`/org/${selectedOrganization?.id}`}
                    className="w-full flex items-center gap-2"
                  >
                    <p>All Projects</p>
                  </Link>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </>
  )
}
