import { prisma } from "@/lib/prisma";
import { computeCorrelation, bucketAttendance } from "@/lib/analytics";
import { summarizeAttendance } from "@/lib/attendance";
import { computeGpa, computeGrade, toPercent } from "@/lib/grading";

const attendanceThreshold = Number(
  process.env.ATTENDANCE_LOW_THRESHOLD ?? "75"
);

export const getActiveTerm = async () => {
  const active = await prisma.term.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
  });
  if (active) return active;
  return prisma.term.findFirst({ orderBy: { startDate: "desc" } });
};

export const getStudentDashboardData = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: { user: true, classroom: true },
  });

  if (!student) return null;

  const term = await getActiveTerm();
  const termFilter = term
    ? {
        offering: {
          termId: term.id,
        },
      }
    : {};

  const results = await prisma.result.findMany({
    where: {
      studentId: student.id,
      ...termFilter,
    },
    include: {
      offering: {
        include: { subject: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const attendance = await prisma.attendance.findMany({
    where: {
      studentId: student.id,
      ...termFilter,
    },
    include: {
      offering: {
        include: { subject: true },
      },
    },
  });

  const subjectPerformance = results.map((row) => {
    const grade = computeGrade(row.score, row.maxScore);
    return {
      subject: row.offering.subject.name,
      percent: grade.percent,
      gradePoint: row.gradePoint ?? grade.gradePoint,
      letter: row.letterGrade ?? grade.letter,
      score: row.score,
      maxScore: row.maxScore,
      credits: row.offering.subject.credits,
    };
  });

  const gpa = computeGpa(subjectPerformance);

  const totals = results.reduce(
    (acc, row) => {
      acc.score += row.score;
      acc.max += row.maxScore;
      return acc;
    },
    { score: 0, max: 0 }
  );

  const overallPercent = toPercent(totals.score, totals.max);

  const attendanceBySubject = new Map<
    string,
    { records: number; present: number }
  >();

  attendance.forEach((row) => {
    const subject = row.offering.subject.name;
    const summary = attendanceBySubject.get(subject) ?? {
      records: 0,
      present: 0,
    };
    summary.records += 1;
    if (row.status === "PRESENT" || row.status === "EXCUSED") {
      summary.present += 1;
    }
    attendanceBySubject.set(subject, summary);
  });

  const attendanceSummary = summarizeAttendance(attendance);
  const attendanceSeries = Array.from(attendanceBySubject.entries()).map(
    ([subject, info]) => ({
      subject,
      percent: info.records
        ? Math.round((info.present / info.records) * 1000) / 10
        : 0,
    })
  );

  return {
    student,
    term,
    subjectPerformance,
    attendanceSummary,
    attendanceSeries,
    overallPercent,
    gpa,
  };
};

export const getAdminDashboardData = async () => {
  const term = await getActiveTerm();
  const termFilter = term
    ? {
        offering: {
          termId: term.id,
        },
      }
    : {};

  const [studentCount, subjectCount, students, results, attendance] =
    await Promise.all([
      prisma.student.count(),
      prisma.subject.count(),
      prisma.student.findMany({ include: { user: true, classroom: true } }),
      prisma.result.findMany({
        where: termFilter,
        include: {
          offering: { include: { subject: true } },
          student: { include: { user: true } },
        },
      }),
      prisma.attendance.findMany({
        where: termFilter,
        include: {
          offering: { include: { subject: true } },
          student: { include: { user: true } },
        },
      }),
    ]);

  const performanceMap = new Map<
    string,
    { score: number; max: number }
  >();
  const attendanceMap = new Map<
    string,
    { present: number; total: number }
  >();
  const subjectMap = new Map<string, { score: number; max: number }>();

  results.forEach((row) => {
    const perf = performanceMap.get(row.studentId) ?? { score: 0, max: 0 };
    perf.score += row.score;
    perf.max += row.maxScore;
    performanceMap.set(row.studentId, perf);

    const subjectName = row.offering.subject.name;
    const subjectPerf = subjectMap.get(subjectName) ?? { score: 0, max: 0 };
    subjectPerf.score += row.score;
    subjectPerf.max += row.maxScore;
    subjectMap.set(subjectName, subjectPerf);
  });

  attendance.forEach((row) => {
    const summary = attendanceMap.get(row.studentId) ?? {
      present: 0,
      total: 0,
    };
    summary.total += 1;
    if (row.status === "PRESENT" || row.status === "EXCUSED") {
      summary.present += 1;
    }
    attendanceMap.set(row.studentId, summary);
  });

  const studentStats = students.map((student) => {
    const perf = performanceMap.get(student.id) ?? { score: 0, max: 0 };
    const att = attendanceMap.get(student.id) ?? { present: 0, total: 0 };
    const performancePercent = toPercent(perf.score, perf.max);
    const attendancePercent = att.total
      ? Math.round((att.present / att.total) * 1000) / 10
      : 0;

    return {
      id: student.id,
      name: student.user.name,
      classroom: student.classroom.name,
      performancePercent,
      attendancePercent,
    };
  });

  const correlation = computeCorrelation(
    studentStats.map((row) => ({
      x: row.attendancePercent,
      y: row.performancePercent,
    }))
  );

  const attendanceDistribution = studentStats.reduce<Record<string, number>>(
    (acc, row) => {
      const bucket = bucketAttendance(row.attendancePercent);
      acc[bucket] = (acc[bucket] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const lowAttendance = studentStats
    .filter((row) => row.attendancePercent < attendanceThreshold)
    .sort((a, b) => a.attendancePercent - b.attendancePercent)
    .slice(0, 8);

  const subjectPerformance = Array.from(subjectMap.entries()).map(
    ([subject, totals]) => ({
      subject,
      average: toPercent(totals.score, totals.max),
    })
  );

  return {
    term,
    studentCount,
    subjectCount,
    studentStats,
    correlation,
    attendanceDistribution,
    lowAttendance,
    subjectPerformance,
  };
};
