import { QuerySearchParamsType } from '../../components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { getUnifiedLogsStartEnd } from './unified-logs-infinite-query'

const logNameMapping: { [key: string]: string } = {
  storage: 'vela-storage',
  'edge function': 'vela-edge-functions',
  auth: 'vela-keycloak',
  postgrest: 'vela-rest',
  postgres: 'vela-db',
}

const getLogName = (logType: string) => logNameMapping[logType] || logType

const getLogTypeQuery = (search: QuerySearchParamsType) => {
  if (search.log_type && search.log_type.length > 0) {
    const types = search.log_type.map((logType) => getLogName(logType)).join('|')
    return `appname=~"${types}"`
  }
  return undefined
}

const getStatusQuery = (search: QuerySearchParamsType) => {
  if (search.status && search.status.length > 0) {
    const statuses = search.status.map((status) => `${status}`).join('|')
    return `status=~"${statuses}"`
  }
  return undefined
}

const getMethodQuery = (search: QuerySearchParamsType) => {
  if (search.method && search.method.length > 0) {
    const methods = search.method.map((method) => `${method}`).join('|')
    return `method=~"${methods}"`
  }
  return undefined
}

const getLevelQuery = (search: QuerySearchParamsType) => {
  if (search.level && search.level.length > 0) {
    const levels = search.level.map((level) => `${level}`).join('|')
    return `severity=~"${levels}"`
  }
  return undefined
}

// TODO @Chris: Move query building to BE (loki.ts)
const baseQuery = (search: QuerySearchParamsType, branchRef: string) => {
  const typesQuery = getLogTypeQuery(search)
  const statusQuery = getStatusQuery(search)
  const methodQuery = getMethodQuery(search)
  const levelQuery = getLevelQuery(search)
  // TODO @Chris: Do we have more elements to add to the query?

  const queryParts = [typesQuery, statusQuery, methodQuery, levelQuery]
    .filter((item) => item !== undefined)
    .join(',')

  return `{branch_id="${branchRef}"${queryParts.length > 0 ? ',' + queryParts : ''}}`
}

export function getUnifiedLogsQuery(search: QuerySearchParamsType, branchRef: string): string {
  return `${baseQuery(search, branchRef)} | json`
}

export function getUnifiedLogsChartsQuery(search: QuerySearchParamsType, branchRef: string): string {
  const baseQuery = getUnifiedLogsQuery(search, branchRef)
  return `sum(count_over_time(${baseQuery}[1m])) by (severity)`
}


export function getUnifiedLogsCountsQuery(search: QuerySearchParamsType, branchRef: string): string {
  const { start, end } = getUnifiedLogsStartEnd(search)
  const window = end - start

  return `sum(count_over_time(${baseQuery(search, branchRef)}[${window}ms]))`
}

