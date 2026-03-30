function normalizeText(value?: string | null) {
  return (value || '').trim();
}

export function getOfficialIntroTaglineLine(saveTimeLabel?: string | null, tagline?: string | null) {
  const intro = normalizeText(saveTimeLabel);
  const line = normalizeText(tagline);

  if (!line) return null;
  if (intro && intro === line) return null;
  return line;
}
