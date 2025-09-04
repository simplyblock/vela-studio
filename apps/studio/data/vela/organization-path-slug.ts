
export function getOrganizationSlug(): string | undefined {
  if (typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.substring(1).split('/');
    if (pathSegments.length >= 2 && (pathSegments[0] === 'org' || pathSegments[0] === 'new')) {
      return pathSegments[1];
    }
  }
  return undefined;
}