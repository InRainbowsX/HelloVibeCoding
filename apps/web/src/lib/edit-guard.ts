export function shouldWarnBeforeLeave(options: {
  isDirty: boolean;
  currentPathname: string;
  nextPathname: string;
}) {
  if (!options.isDirty) return false;
  return options.currentPathname !== options.nextPathname;
}
