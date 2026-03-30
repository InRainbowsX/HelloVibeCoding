export type ProjectPrimaryTab = 'overview' | 'teardown';

export function getProjectPrimaryTabFromPath(pathname: string, slug: string): ProjectPrimaryTab {
  return 'overview';
}
