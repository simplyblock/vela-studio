import { describe, it, expect } from 'vitest'
import { getCloudProviderArchitecture } from './cloudprovider-utils'
describe('getCloudProviderArchitecture', () => {
  it('should return an empty string if the cloud provider is not supported', () => {
    const result = getCloudProviderArchitecture('unknown')

    expect(result).toBe('')
  })
})
