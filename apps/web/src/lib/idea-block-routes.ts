export function getIdeaBlockDetailPath(slug: string) {
  return `/idea-blocks/${slug}`;
}

export function getIdeaBlocksIndexPath() {
  return '/idea-blocks';
}

export function getIdeaBlockDetailCta(slug: string) {
  return {
    to: getIdeaBlockDetailPath(slug),
    label: '查看点子详情',
  };
}
