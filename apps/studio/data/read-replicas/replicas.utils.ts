import { last } from 'lodash'

export const formatDatabaseID = (id: string) => last(id.split('-') ?? [])
