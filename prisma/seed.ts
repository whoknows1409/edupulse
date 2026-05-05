import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

type GradeBand = {
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
  if (!input) return defaultScale;

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

const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, value));

const toPercent = (score: number, maxScore: number) => {
  if (!maxScore || maxScore <= 0) return 0;
  const percent = (score / maxScore) * 100;
  return Math.round(clampPercent(percent) * 10) / 10;
};

const getGradeBand = (percent: number) => {
  const clamped = clampPercent(percent);
  return gradeScale.find((band) => clamped >= band.min) ??
    gradeScale.at(-1)!;
};

const computeGrade = (score: number, maxScore: number) => {
  const percent = toPercent(score, maxScore);
  const band = getGradeBand(percent);
  return {
    percent,
    gradePoint: band.point,
    letter: band.letter,
  };
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const sampleStudents = [
  { name: "Aarav Patel", email: "aarav@edupulse.dev", studentId: "STU-1001" },
  { name: "Maya Chen", email: "maya@edupulse.dev", studentId: "STU-1002" },
  { name: "Liam Okafor", email: "liam@edupulse.dev", studentId: "STU-1003" },
  { name: "Zara Khan", email: "zara@edupulse.dev", studentId: "STU-1004" },
];

const subjects = [
  { code: "CS101", name: "Data Structures", credits: 4 },
  { code: "CS102", name: "Operating Systems", credits: 3 },
  { code: "CS103", name: "Database Systems", credits: 3 },
  { code: "CS104", name: "Discrete Mathematics", credits: 3 },
];

const createAttendanceDates = () => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i * 2);
    dates.push(date);
  }
  return dates;
};

const main = async () => {
  await prisma.attendance.deleteMany();
  await prisma.result.deleteMany();
  await prisma.subjectOffering.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.term.deleteMany();

  const adminPassword = await hash("Admin@123", 10);
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@edupulse.dev",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const classroom = await prisma.classroom.create({
    data: {
      name: "BSc Computer Science",
      section: "A",
      year: 2026,
    },
  });

  const term = await prisma.term.create({
    data: {
      name: "Spring 2026",
      startDate: new Date("2026-01-08"),
      endDate: new Date("2026-05-12"),
      isActive: true,
    },
  });

  const createdSubjects = await Promise.all(
    subjects.map((subject) => prisma.subject.create({ data: subject }))
  );

  const offerings = await Promise.all(
    createdSubjects.map((subject) =>
      prisma.subjectOffering.create({
        data: {
          subjectId: subject.id,
          classroomId: classroom.id,
          termId: term.id,
        },
      })
    )
  );

  const students = await Promise.all(
    sampleStudents.map(async (student) => {
      const passwordHash = await hash("Student@123", 10);
      const user = await prisma.user.create({
        data: {
          name: student.name,
          email: student.email,
          passwordHash,
          role: "STUDENT",
        },
      });
      return prisma.student.create({
        data: {
          userId: user.id,
          studentId: student.studentId,
          enrollmentYear: 2024,
          classroomId: classroom.id,
        },
      });
    })
  );

  for (const student of students) {
    for (const offering of offerings) {
      const score = 60 + Math.round(Math.random() * 35);
      const maxScore = 100;
      const grade = computeGrade(score, maxScore);

      await prisma.result.create({
        data: {
          studentId: student.id,
          offeringId: offering.id,
          score,
          maxScore,
          gradePoint: grade.gradePoint,
          letterGrade: grade.letter,
        },
      });
    }
  }

  const attendanceDates = createAttendanceDates();
  for (const student of students) {
    for (const offering of offerings) {
      for (const date of attendanceDates) {
        const roll = Math.random();
        const status = roll < 0.1 ? "ABSENT" : roll < 0.2 ? "EXCUSED" : "PRESENT";
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            offeringId: offering.id,
            date,
            status,
          },
        });
      }
    }
  }

  console.log("Seed data created.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
