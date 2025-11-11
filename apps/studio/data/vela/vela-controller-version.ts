import { get, handleError } from '../fetchers'
import { useQuery } from '@tanstack/react-query'

export function useVelaControllerVersionQuery() {
  return useQuery({
    queryKey:['vela-controller-deployment-version'],
    queryFn: async () => {
      const { data, error } = await get('/platform/controller-version')
      if (error) handleError(error)
      return data
    },
    }
  )
}