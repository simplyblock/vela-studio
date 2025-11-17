import { QuerySearchParamsType } from 'components/interfaces/UnifiedLogs/UnifiedLogs.types'

export const logsKeys = {
  unifiedLogsInfinite: (
    orgRef: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined,
    searchParams: QuerySearchParamsType | undefined
  ) =>
    [
      'branches',
      orgRef,
      projectRef,
      branchRef,
      'unified-logs',
      'logs-data',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  unifiedLogsCount: (
    orgRef: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined,
    searchParams: QuerySearchParamsType | undefined
  ) =>
    [
      'branches',
      orgRef,
      projectRef,
      branchRef,
      'unified-logs',
      'count-data',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  unifiedLogsChart: (
    orgRef: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined,
    searchParams: QuerySearchParamsType | undefined
  ) =>
    [
      'branches',
      orgRef,
      projectRef,
      branchRef,
      'unified-logs',
      'chart-data',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  unifiedLogsFacetCount: (
    orgRef: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined,
    facet: string,
    facetSearch: string | undefined,
    searchParams: QuerySearchParamsType | undefined
  ) =>
    [
      'branches',
      orgRef,
      projectRef,
      branchRef,
      'unified-logs',
      'count-data',
      facet,
      facetSearch,
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  serviceFlow: (
    orgRef: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined,
    searchParams: QuerySearchParamsType | undefined,
    logId: string | undefined
  ) =>
    [
      'branches',
      orgRef,
      projectRef,
      branchRef,
      'unified-logs',
      'service-flow',
      logId,
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
}
