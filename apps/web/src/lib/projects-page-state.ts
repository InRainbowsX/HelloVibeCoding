export type ProjectsSortMode = 'latest' | 'heat' | 'discussion' | 'incubation';

export type ProjectsPageState = {
  activeCategory: string;
  sortMode: ProjectsSortMode;
  scrollY: number;
};

const STORAGE_KEY = 'hvc:projects-page-state';

export function loadProjectsPageState(): ProjectsPageState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProjectsPageState>;

    if (typeof parsed.activeCategory !== 'string') return null;
    if (!isProjectsSortMode(parsed.sortMode)) return null;
    if (typeof parsed.scrollY !== 'number' || !Number.isFinite(parsed.scrollY)) return null;

    return {
      activeCategory: parsed.activeCategory,
      sortMode: parsed.sortMode,
      scrollY: Math.max(0, parsed.scrollY),
    };
  } catch {
    return null;
  }
}

export function saveProjectsPageState(state: ProjectsPageState) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isProjectsSortMode(value: unknown): value is ProjectsSortMode {
  return value === 'latest' || value === 'heat' || value === 'discussion' || value === 'incubation';
}

