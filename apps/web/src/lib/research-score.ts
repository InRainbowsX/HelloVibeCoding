export type ResearchScoreInput = {
  heatScore: number;
  discussionCount: number;
  ideaBlockCount: number;
  incubationCount: number;
  roomCount: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function computeResearchScore(input: ResearchScoreInput) {
  const heatContribution = clamp((input.heatScore / 100) * 1.7, 0, 1.7);
  const discussionContribution = clamp((input.discussionCount / 6) * 1.1, 0, 1.1);
  const ideaContribution = clamp((input.ideaBlockCount / 4) * 0.6, 0, 0.6);
  const incubationContribution = clamp((input.incubationCount / 2) * 0.4, 0, 0.4);
  const roomContribution = clamp((input.roomCount / 2) * 0.2, 0, 0.2);

  return roundToOneDecimal(
    clamp(6 + heatContribution + discussionContribution + ideaContribution + incubationContribution + roomContribution, 6, 10),
  );
}
