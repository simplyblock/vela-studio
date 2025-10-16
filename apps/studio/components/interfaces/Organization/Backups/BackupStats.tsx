import { HardDrive, Layers3, PlayCircle, RefreshCcw } from 'lucide-react'

import { StatsCard } from 'components/ui/StatsCard'

type BackupStatsProps = {
  totalProjects: number
  enabledProjects: number
  totalBackups: number
  totalStorageUsed: string
}

export const BackupStats = ({
  totalProjects,
  enabledProjects,
  totalBackups,
  totalStorageUsed,
}: BackupStatsProps) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    <StatsCard
      title="Total Projects"
      value={totalProjects}
      description="Projects with backup tracking enabled"
      icon={<Layers3 size={18} />}
    />
    <StatsCard
      title="Auto Backups Enabled"
      value={enabledProjects}
      description="Projects currently protected by automation"
      icon={<PlayCircle size={18} />}
    />
    <StatsCard
      title="Total Backups"
      value={totalBackups}
      description="Backups retained across all projects"
      icon={<RefreshCcw size={18} />}
    />
    <StatsCard
      title="Storage Used"
      value={totalStorageUsed}
      description="Aggregated storage consumed by backups"
      icon={<HardDrive size={18} />}
    />
  </div>
)
