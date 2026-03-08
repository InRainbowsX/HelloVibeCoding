export interface CreateIdeaEvidenceDto {
  sourceAppId?: string;
  appTitle: string;
  appUrl: string;
  platform: string;
  iconUrl?: string;
  screenshotUrls?: string[];
  fetchStatus?: string;
  fetchNote?: string;
  how: string;
  cpHook: string;
  cpWow: string;
  cpReturn: string;
}
