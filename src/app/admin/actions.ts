"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { computeGrade } from "@/lib/grading";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/access";
import {
  createOfferingSchema,
  createResultSchema,
  createStudentSchema,
  createSubjectSchema,
  createTermSchema,
  createClassroomSchema,
  recordAttendanceSchema,
} from "@/lib/validators";

type ActionState = {
  error?: string;
  success?: string;
};

const parseError = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

export const createStudentAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  await requireRole("ADMIN");
  const parsed = createStudentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    studentId: formData.get("studentId"),
    enrollmentYear: formData.get("enrollmentYear"),
    classroomId: formData.get("classroomId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Provide all required fields." };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return { error: "Email already exists." };
    }

    const passwordHash = await hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "STUDENT",
      },
    });

    await prisma.student.create({
      data: {
        userId: user.id,
        studentId: parsed.data.studentId,
        enrollmentYear: parsed.data.enrollmentYear,
        classroomId: parsed.data.classroomId,
      },
    });

    revalidatePath("/admin/students");
    return { success: "Student created." };
  } catch (error) {
    return { error: parseError(error) };
  }
};

export const createClassroomAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  await requireRole("ADMIN");
  const parsed = createClassroomSchema.safeParse({
    name: formData.get("name"),
    section: formData.get("section"),
    year: formData.get("year"),
  });

  if (!parsed.success) {
    return { error: "Provide classroom name and year." };
  }

  try {
    await prisma.classroom.create({
      data: {
        name: parsed.data.name,
        section: parsed.data.section?.trim() || null,
        year: parsed.data.year,
      },
    });
    revalidatePath("/admin/students");
    revalidatePath("/admin/subjects");
    return { success: "Classroom created." };
  } catch (error) {
    return { error: parseError(error) };
  }
};

export const createSubjectAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  await requireRole("ADMIN");
  const parsed = createSubjectSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    credits: formData.get("credits"),
  });

  if (!parsed.success) {
    return { error: "Provide subject code, name, and credits." };
  }

  try {
    await prisma.subject.create({
      data: parsed.data,
    });
    revalidatePath("/admin/subjects");
    return { success: "Subject created." };
  } catch (error) {
    return { error: parseError(error) };
  }
};

export const createTermAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  await requireRole("ADMIN");
  const parsed = createTermSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { error: "Provide term details." };
  }

  try {
    if (parsed.data.isActive) {
      await prisma.term.updateMany({ data: { isActive: false } });
    }

    await prisma.term.create({
      data: {
        name: parsed.data.name,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        isActive: Boolean(parsed.data.isActive),
      },
    });

    revalidatePath("/admin/subjects");
    revalidatePath("/admin");
    return { success: "Term created." };
  } catch (error) {
    return { error: parseError(error) };
  }
};

export const createOfferingAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  await requireRole("ADMIN");
  const parsed = createOfferingSchema.safeParse({
    subjectId: formData.get("subjectId"),
    classroomId: formData.get("classroomId"),
    termId: formData.get("termId"),
  });

  if (!parsed.success) {
    return { error: "Select subject, classroom, and term." };
  }

  try {
    await prisma.subjectOffering.upsert({
      where: {
        subjectId_classroomId_termId: {
          subjectId: parsed.data.subjectId,
          classroomId: parsed.data.classroomId,
          termId: parsed.data.termId,
        },
      },
      update: {},
      create: parsed.data,
    });

    revalidatePath("/admin/subjects");
    return { success: "Offering created." };
  } catch (error) {
    return { error: parseError(error) };
  }
};

export const createResultAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  await requireRole("ADMIN");
  const parsed = createResultSchema.safeParse({
    studentId: formData.get("studentId"),
    offeringId: formData.get("offeringId"),
    score: formData.get("score"),
    maxScore: formData.get("maxScore"),
  });

  if (!parsed.success) {
    return { error: "Provide student, subject, and scores." };
  }

  try {
    const grade = computeGrade(parsed.data.score, parsed.data.maxScore);
    await prisma.result.upsert({
      where: {
        studentId_offeringId: {
          studentId: parsed.data.studentId,
          offeringId: parsed.data.offeringId,
        },
      },
      update: {
        score: parsed.data.score,
        maxScore: parsed.data.maxScore,
        gradePoint: grade.gradePoint,
        letterGrade: grade.letter,
      },
      create: {
        studentId: parsed.data.studentId,
        offeringId: parsed.data.offeringId,
        score: parsed.data.score,
        maxScore: parsed.data.maxScore,
        gradePoint: grade.gradePoint,
        letterGrade: grade.letter,
      },
    });

    revalidatePath("/admin/results");
    revalidatePath("/admin");
    return { success: "Result saved." };
  } catch (error) {
    return { error: parseError(error) };
  }
};

export const recordAttendanceAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  await requireRole("ADMIN");
  const parsed = recordAttendanceSchema.safeParse({
    studentId: formData.get("studentId"),
    offeringId: formData.get("offeringId"),
    date: formData.get("date"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Provide student, subject, date, and status." };
  }

  try {
    await prisma.attendance.upsert({
      where: {
        studentId_offeringId_date: {
          studentId: parsed.data.studentId,
          offeringId: parsed.data.offeringId,
          date: new Date(parsed.data.date),
        },
      },
      update: {
        status: parsed.data.status,
      },
      create: {
        studentId: parsed.data.studentId,
        offeringId: parsed.data.offeringId,
        date: new Date(parsed.data.date),
        status: parsed.data.status,
      },
    });

    revalidatePath("/admin/attendance");
    revalidatePath("/admin");
    return { success: "Attendance saved." };
  } catch (error) {
    return { error: parseError(error) };
  }
};
