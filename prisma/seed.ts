import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
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

type SeedStudent = {
  name: string;
  email: string;
  studentId: string;
  enrollmentYear?: number;
  password?: string;
};

type SeedSubject = {
  code: string;
  name: string;
  credits?: number;
};

type SeedResult = {
  studentId: string;
  subjectCode: string;
  score: number;
  maxScore: number;
};

type SeedAttendance = {
  studentId: string;
  subjectCode: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
};

type SeedData = {
  classroom?: { name: string; section?: string | null; year: number };
  term?: {
    name: string;
    startDate: string;
    endDate: string;
    isActive?: boolean;
  };
  subjects?: SeedSubject[];
  students?: SeedStudent[];
  admin?: { name?: string; email?: string; password?: string };
  results?: SeedResult[];
  attendance?: SeedAttendance[];
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const sampleStudents: SeedStudent[] = [
  { name: "Aarav Patel", email: "aarav@edupulse.dev", studentId: "STU-1001" },
  { name: "Maya Chen", email: "maya@edupulse.dev", studentId: "STU-1002" },
  { name: "Liam Okafor", email: "liam@edupulse.dev", studentId: "STU-1003" },
  { name: "Zara Khan", email: "zara@edupulse.dev", studentId: "STU-1004" },
];

const subjects: SeedSubject[] = [
  { code: "CS101", name: "Data Structures", credits: 4 },
  { code: "CS102", name: "Operating Systems", credits: 3 },
  { code: "CS103", name: "Database Systems", credits: 3 },
  { code: "CS104", name: "Discrete Mathematics", credits: 3 },
];

const defaultClassroom = {
  name: "BSc Computer Science",
  section: "A",
  year: 2026,
};

const defaultTerm = {
  name: "Spring 2026",
  startDate: "2026-01-08",
  endDate: "2026-05-12",
  isActive: true,
};

const loadSeedData = (): SeedData | null => {
  const seedPath =
    process.env.SEED_DATA_PATH ??
    path.join(process.cwd(), "data", "student_data.json");

  if (!fs.existsSync(seedPath)) {
    return null;
  }

  const raw = fs.readFileSync(seedPath, "utf-8");
  return JSON.parse(raw) as SeedData;
};

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
  const seedData = loadSeedData();
  const classroomInput = seedData?.classroom ?? defaultClassroom;
  const termInput = seedData?.term ?? defaultTerm;
  const subjectInput =
    seedData?.subjects && seedData.subjects.length
      ? seedData.subjects
      : subjects;
  const studentInput =
    seedData?.students && seedData.students.length
      ? seedData.students
      : sampleStudents;

  await prisma.attendance.deleteMany();
  await prisma.result.deleteMany();
  await prisma.subjectOffering.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany({ where: { role: "STUDENT" } });
  await prisma.subject.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.term.deleteMany();

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!existingAdmin) {
    const adminPassword = await hash(
      seedData?.admin?.password ?? "Admin@123",
      10
    );
    await prisma.user.create({
      data: {
        name: seedData?.admin?.name ?? "Admin User",
        email: seedData?.admin?.email ?? "admin@edupulse.dev",
        passwordHash: adminPassword,
        role: "ADMIN",
      },
    });
  }

  const classroom = await prisma.classroom.create({
    data: {
      name: classroomInput.name,
      section: classroomInput.section ?? undefined,
      year: classroomInput.year,
    },
  });

  const term = await prisma.term.create({
    data: {
      name: termInput.name,
      startDate: new Date(termInput.startDate),
      endDate: new Date(termInput.endDate),
      isActive: termInput.isActive ?? false,
    },
  });

  const createdSubjects = await Promise.all(
    subjectInput.map((subject) =>
      prisma.subject.create({
        data: {
          code: subject.code,
          name: subject.name,
          credits: subject.credits ?? 3,
        },
      })
    )
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
    studentInput.map(async (student) => {
      const passwordHash = await hash(student.password ?? "Student@123", 10);
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
          enrollmentYear: student.enrollmentYear ?? 2024,
          classroomId: classroom.id,
        },
      });
    })
  );

  const studentByStudentId = new Map(
    students.map((student) => [student.studentId, student])
  );
  const offeringBySubjectCode = new Map(
    createdSubjects.map((subject, index) => [subject.code, offerings[index]])
  );

  if (seedData?.results && seedData.results.length) {
    for (const row of seedData.results) {
      const student = studentByStudentId.get(row.studentId);
      const offering = offeringBySubjectCode.get(row.subjectCode);
      if (!student || !offering) {
        console.warn(
          `Skipping result for ${row.studentId} / ${row.subjectCode}`
        );
        continue;
      }
      const grade = computeGrade(row.score, row.maxScore);
      await prisma.result.create({
        data: {
          studentId: student.id,
          offeringId: offering.id,
          score: row.score,
          maxScore: row.maxScore,
          gradePoint: grade.gradePoint,
          letterGrade: grade.letter,
        },
      });
    }
  } else {
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
  }

  if (seedData?.attendance && seedData.attendance.length) {
    for (const row of seedData.attendance) {
      const student = studentByStudentId.get(row.studentId);
      const offering = offeringBySubjectCode.get(row.subjectCode);
      if (!student || !offering) {
        console.warn(
          `Skipping attendance for ${row.studentId} / ${row.subjectCode}`
        );
        continue;
      }
      const date = new Date(row.date);
      if (Number.isNaN(date.getTime())) {
        console.warn(`Skipping attendance with invalid date ${row.date}`);
        continue;
      }
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          offeringId: offering.id,
          date,
          status: row.status,
        },
      });
    }
  } else {
    const attendanceDates = createAttendanceDates();
    for (const student of students) {
      for (const offering of offerings) {
        for (const date of attendanceDates) {
          const roll = Math.random();
          const status =
            roll < 0.1 ? "ABSENT" : roll < 0.2 ? "EXCUSED" : "PRESENT";
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
