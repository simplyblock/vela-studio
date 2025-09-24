import { env } from '../env.config'

/**
 * Returns true if running in CLI/self-hosted mode (locally),
 * false if running in hosted mode.
 */
export function isCLI(): boolean {
  return false
}
