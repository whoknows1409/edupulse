"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
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

type ImportActionState = ActionState & {
  details?: string[];
};

const parseError = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

const normalizeHeader = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const cellToString = (cell: ExcelJS.Cell | undefined) => {
  if (!cell) return "";
  const value = cell.text ?? cell.value;
  return String(value ?? "").trim();
};

const toStatus = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (["p", "present"].includes(normalized)) {
    return "PRESENT" as const;
  }
  if (["a", "absent"].includes(normalized)) {
    return "ABSENT" as const;
  }
  return null;
};

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

export const bulkMarkAttendanceAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  await requireRole("ADMIN");
  const offeringId = String(formData.get("offeringId") ?? "").trim();
  const dateValue = String(formData.get("date") ?? "").trim();

  if (!offeringId || !dateValue) {
    return { error: "Select a subject offering and date." };
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return { error: "Invalid date." };
  }

  const offering = await prisma.subjectOffering.findUnique({
    where: { id: offeringId },
    select: { classroomId: true },
  });

  if (!offering) {
    return { error: "Subject offering not found." };
  }

  const students = await prisma.student.findMany({
    where: { classroomId: offering.classroomId },
    select: { id: true },
  });

  if (students.length === 0) {
    return { error: "No students found for this classroom." };
  }

  await prisma.$transaction(
    students.map((student) =>
      prisma.attendance.upsert({
        where: {
          studentId_offeringId_date: {
            studentId: student.id,
            offeringId,
            date,
          },
        },
        update: { status: "PRESENT" },
        create: {
          studentId: student.id,
          offeringId,
          date,
          status: "PRESENT",
        },
      })
    )
  );

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  return { success: `Marked ${students.length} students present.` };
};

export const importAttendanceAction = async (
  _prev: ImportActionState,
  formData: FormData
): Promise<ImportActionState> => {
  await requireRole("ADMIN");

  const offeringId = String(formData.get("offeringId") ?? "").trim();
  const dateValue = String(formData.get("date") ?? "").trim();
  const file = formData.get("file");

  if (!offeringId || !dateValue || !(file instanceof File)) {
    return { error: "Select a subject, date, and Excel file." };
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { error: "Upload a .xlsx file." };
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return { error: "Invalid date." };
  }

  const offering = await prisma.subjectOffering.findUnique({
    where: { id: offeringId },
  });

  if (!offering) {
    return { error: "Subject offering not found." };
  }

  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];

  if (!sheet) {
    return { error: "No worksheet found in the Excel file." };
  }

  const headerRow = sheet.getRow(1);
  const headerMap = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const headerValue = normalizeHeader(cellToString(cell));
    if (headerValue) {
      headerMap.set(headerValue, colNumber);
    }
  });

  const uidCol =
    headerMap.get("uid") ??
    headerMap.get("student id") ??
    headerMap.get("studentid") ??
    headerMap.get("roll no") ??
    headerMap.get("roll number");
  const statusCol = headerMap.get("status");
  const nameCol = headerMap.get("name");

  if (!uidCol || !statusCol) {
    return { error: "Excel must include UID and Status columns." };
  }

  const parsedRows: Array<{
    rowNumber: number;
    uid: string;
    name: string;
    statusRaw: string;
  }> = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const uid = cellToString(row.getCell(uidCol));
    const statusRaw = cellToString(row.getCell(statusCol));
    const name = nameCol ? cellToString(row.getCell(nameCol)) : "";
    if (!uid && !statusRaw && !name) return;
    parsedRows.push({ rowNumber, uid, name, statusRaw });
  });

  if (parsedRows.length === 0) {
    return { error: "The Excel file is empty." };
  }

  const errors: string[] = [];
  const validRows = parsedRows.filter((row) => {
    if (!row.uid) {
      errors.push(`Row ${row.rowNumber}: missing UID.`);
      return false;
    }
    if (!row.statusRaw) {
      errors.push(`Row ${row.rowNumber}: missing Status.`);
      return false;
    }
    const status = toStatus(row.statusRaw);
    if (!status) {
      errors.push(
        `Row ${row.rowNumber}: invalid Status '${row.statusRaw}'. Use P or A.`
      );
      return false;
    }
    return true;
  });

  if (validRows.length === 0) {
    return { error: "No valid rows found in the Excel file.", details: errors.slice(0, 10) };
  }

  const uidList = Array.from(new Set(validRows.map((row) => row.uid)));
  const students = await prisma.student.findMany({
    where: { studentId: { in: uidList } },
    select: { id: true, studentId: true },
  });

  const studentByUid = new Map(
    students.map((student) => [student.studentId, student])
  );

  let successCount = 0;
  for (const row of validRows) {
    const student = studentByUid.get(row.uid);
    if (!student) {
      errors.push(`Row ${row.rowNumber}: UID '${row.uid}' not found.`);
      continue;
    }

    const status = toStatus(row.statusRaw);
    if (!status) {
      errors.push(
        `Row ${row.rowNumber}: invalid Status '${row.statusRaw}'. Use P or A.`
      );
      continue;
    }

    await prisma.attendance.upsert({
      where: {
        studentId_offeringId_date: {
          studentId: student.id,
          offeringId,
          date,
        },
      },
      update: { status },
      create: {
        studentId: student.id,
        offeringId,
        date,
        status,
      },
    });
    successCount += 1;
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");

  return {
    success: `Imported ${successCount} rows. Skipped ${errors.length}.`,
    details: errors.slice(0, 10),
  };
};
