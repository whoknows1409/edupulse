export type GradeBand = {
  min: number;
  point: number;
  letter: string;
};

const defaultScale: GradeBand[] = [
  { min: 90, point: 4.0, letter: "A" },
  { min: 85, point: 3.7, letter: "A-" },
  { min: 80, point: 3.3, letter: "B+" },
  { min: 75, point: 3.0, letter: "B" },
  { min: 70, point: 2.7, letter: "B-" },
  { min: 65, point: 2.3, letter: "C+" },
  { min: 60, point: 2.0, letter: "C" },
  { min: 50, point: 1.0, letter: "D" },
  { min: 0, point: 0.0, letter: "F" },
];

const parseScale = (input?: string): GradeBand[] => {
  if (!input) {
    return defaultScale;
  }

  const parsed = input
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [minRaw, pointRaw, letterRaw] = segment.split(":");
      const min = Number(minRaw);
      const point = Number(pointRaw);
      const letter = letterRaw?.trim();
      if (Number.isNaN(min) || Number.isNaN(point) || !letter) {
        return null;
      }
      return { min, point, letter } satisfies GradeBand;
    })
    .filter((item): item is GradeBand => item !== null)
    .sort((a, b) => b.min - a.min);

  return parsed.length ? parsed : defaultScale;
};

const gradeScale = parseScale(process.env.GPA_SCALE);

export const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, value));

export const toPercent = (score: number, maxScore: number) => {
  if (!maxScore || maxScore <= 0) {
    return 0;
  }
  const percent = (score / maxScore) * 100;
  return Math.round(clampPercent(percent) * 10) / 10;
};

export const getGradeBand = (percent: number) => {
  const clamped = clampPercent(percent);
  return gradeScale.find((band) => clamped >= band.min) ?? gradeScale.at(-1)!;
};

export const computeGrade = (score: number, maxScore: number) => {
  const percent = toPercent(score, maxScore);
  const band = getGradeBand(percent);
  return {
    percent,
    gradePoint: band.point,
    letter: band.letter,
  };
};

export const computeGpa = (
  rows: Array<{ gradePoint: number; credits?: number | null }>
) => {
  if (!rows.length) {
    return 0;
  }

  let totalCredits = 0;
  let weightedSum = 0;

  rows.forEach((row) => {
    const credits = row.credits ?? 1;
    totalCredits += credits;
    weightedSum += row.gradePoint * credits;
  });

  if (!totalCredits) {
    return 0;
  }

  return Math.round((weightedSum / totalCredits) * 100) / 100;
};
