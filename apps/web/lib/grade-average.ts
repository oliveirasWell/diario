export function scoreOutOfTen(score: number, maxScore: number) {
  return (score / (maxScore || 10)) * 10;
}

export function averageScore(scores: number[]): number | null {
  if (!scores.length) {
    return null;
  }
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Number((total / scores.length).toFixed(1));
}
