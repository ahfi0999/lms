import { AppEventType } from '@prisma/client';
import { string, z } from 'zod';

export const idSchema = z.coerce.number().int().positive();
export const passwordSchema = z.string().min(6);
export const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((v) => v.toLowerCase());

export const signInDataSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpDataSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1),
});

export const forgotPasswordDataSchema = z.object({
  email: emailSchema,
});

export const resetPasswordDataSchema = z.object({
  newPassword: passwordSchema,
  token: z.string(),
});

// Course schemas
export const courseDetailsSchema = z.object({
  title: z
    .string({
      invalid_type_error: 'Title must be a string',
    })
    .min(1, {
      message: 'Title must be at least 1 character long',
    }),
  description: z
    .string({
      invalid_type_error: 'Description must be a string',
    })
    .min(1, {
      message: 'Description must be at least 1 character long',
    }),
  liveLink: z.preprocess(
    (val) => (val === '' ? null : val),
    z
      .string()
      .url({
        message: 'Live link must be a valid URL',
      })
      .nullable()
      .default(null)
  ),
  contentLink: z.string().optional(),
});

export const addModuleSchema = z.object({
  title: z
    .string({
      invalid_type_error: 'Title must be a string',
    })
    .min(1, {
      message: 'Title must be at least 1 character long',
    })
    .max(100, {
      message: 'Title must be at most 100 characters long',
    }),
});

export const addTopicSchema = z.object({
  title: z
    .string({
      invalid_type_error: 'Title must be a string',
    })
    .min(1, {
      message: 'Title must be at least 1 character long',
    })
    .max(100, {
      message: 'Title must be at most 100 characters long',
    }),
  videoLink: z.preprocess(
    (val) => (val === '' ? null : val),
    z
      .string()
      .url({
        message: 'Video link must be a valid URL',
      })
      .nullable()
      .default(null)
  ),
});

export const coursePatchSchema = z
  .object({
    archived: z.coerce.boolean(),
  })
  .partial();

export const moduleOrderChangeSchema = z.object({
  source: z.number().nonnegative(),
  destination: z.number().nonnegative(),
  courseId: idSchema,
});

export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(1),
  role: z.enum(['user', 'admin']),
  courses: z.array(idSchema).optional(),
});

export const updateUserSchema = createUserSchema.extend({
  active: z.boolean(),
});

export const usersListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(10),
  search: z.coerce.string().optional(),
  courseId: z.coerce.number().int().positive().optional(),
  orderBy: z.enum(['name', 'email', 'createdAt', 'role', 'active', 'lastLogin']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export const attachmentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  courseId: idSchema.optional(),
  topicId: idSchema.optional(),
  type: z.enum(['resourceFile', 'projectFile', 'assignmentFile', 'topicFile']),
});

export const updateModuleSchema = z.object({
  title: z.string().nonempty({ message: 'Title is required' }),
  topics: z
    .object({
      title: z.string().nonempty({ message: 'Title is required' }),
      videoLink: z.string().url().nullable(),
      id: idSchema.optional(),
    })
    .array()
    .min(1)
    .max(20),
  courseId: idSchema,
});

export const unenrollSchema = z.object({
  courseId: idSchema,
  userId: z.string().min(1),
});

export const enrolledByQuerySchema = z.object({
  courseId: idSchema,
  page: z.coerce.number().int().default(0),
  // limit: z.coerce.number().int().positive().max(200).default(10),
});

// comma separated list of emails
export const bulkEnrollSchema = z.preprocess(
  (val) =>
    String(val)
      .split(',')
      .map((email) => email.trim().normalize().toLowerCase()),
  z.array(emailSchema)
);

export const appEventsSchema = z.object({
  courseId: idSchema,
  type: z.string().nonempty(),
});
