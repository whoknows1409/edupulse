import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  studentId: z.string().min(3),
  enrollmentYear: z.coerce.number().int().min(2000).max(2100),
  classroomId: z.string().min(1),
  password: z.string().min(8),
});

export const createClassroomSchema = z.object({
  name: z.string().min(2),
  section: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const createSubjectSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  credits: z.coerce.number().int().min(1).max(10),
});

export const createTermSchema = z.object({
  name: z.string().min(2),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  isActive: z.coerce.boolean().optional(),
});

export const createOfferingSchema = z.object({
  subjectId: z.string().min(1),
  classroomId: z.string().min(1),
  termId: z.string().min(1),
});

export const createResultSchema = z.object({
  studentId: z.string().min(1),
  offeringId: z.string().min(1),
  score: z.coerce.number().min(0),
  maxScore: z.coerce.number().min(1),
});

export const recordAttendanceSchema = z.object({
  studentId: z.string().min(1),
  offeringId: z.string().min(1),
  date: z.string().min(8),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED"]),
});
