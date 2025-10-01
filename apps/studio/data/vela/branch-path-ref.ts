export function getBranchRef(): string | undefined {
  if (typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.substring(1).split('/');
    if (pathSegments.length >= 6 && pathSegments[0] === 'org' && pathSegments[2] === 'project' && pathSegments[4] === 'branch') {
      return pathSegments[5];
    }
  }
  return undefined;
}