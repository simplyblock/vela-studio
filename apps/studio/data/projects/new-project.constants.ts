import { components } from 'api-types'

export type DesiredInstanceSize = Exclude<
  components['schemas']['CreateProjectBody']['desired_instance_size'],
  undefined | 'pico' | 'nano'
>
export type ReleaseChannel = Exclude<
  components['schemas']['CreateProjectBody']['release_channel'],
  undefined
>
export type PostgresEngine = Exclude<
  components['schemas']['CreateProjectBody']['postgres_engine'],
  undefined
>
