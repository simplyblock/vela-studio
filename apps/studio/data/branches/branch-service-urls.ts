export function useBranchRestServiceUrl(branchId: string) {
  return {
    data: `https://${branchId}.vela.run/`
  }
}