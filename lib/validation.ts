import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(1, 'Password required'),
});

export const createUserSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Minimum 6 characters'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  role: z.enum(['ADMIN', 'PROF', 'STUDENT']),
});

export const createFiliereSchema = z.object({
  name: z.string().min(1, 'Name required'),
});

export const createGroupeSchema = z.object({
  name: z.string().min(1, 'Name required'),
  filiereId: z.string().cuid(),
});

export const createModuleSchema = z.object({
  name: z.string().min(1, 'Name required'),
  filiereId: z.string().cuid(),
});

export const createSeanceSchema = z.object({
  moduleId: z.string().cuid(),
  groupeId: z.string().cuid(),
  date: z.coerce.date(),
  startTime: z.string().min(1, 'Start time required'),
  endTime: z.string().min(1, 'End time required'),
});

export const scanSchema = z.object({
  seanceId: z.string().cuid(),
  token: z.string(),
  scannedAt: z.coerce.date().optional(),
  deviceId: z.string().optional(),
});

export const enrollSchema = z.object({
  studentId: z.string().cuid(),
  groupeId: z.string().cuid(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateFiliereInput = z.infer<typeof createFiliereSchema>;
export type CreateGroupeInput = z.infer<typeof createGroupeSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateSeanceInput = z.infer<typeof createSeanceSchema>;
export type ScanInput = z.infer<typeof scanSchema>;
export type EnrollInput = z.infer<typeof enrollSchema>;
