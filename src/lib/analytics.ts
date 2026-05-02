export type CorrelationPoint = {
  x: number;
  y: number;
};

export const computeCorrelation = (points: CorrelationPoint[]) => {
  if (points.length < 2) {
    return null;
  }

  const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  points.forEach((point) => {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  });

  const denominator = Math.sqrt(denomX * denomY);
  if (!denominator) {
    return null;
  }

  return Math.round((numerator / denominator) * 1000) / 1000;
};

export const bucketAttendance = (value: number) => {
  if (value >= 90) return "90-100%";
  if (value >= 80) return "80-89%";
  if (value >= 70) return "70-79%";
  if (value >= 60) return "60-69%";
  return "<60%";
};
