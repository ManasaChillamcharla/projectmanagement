import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional().default(""),
    requirement: z.string().min(10)
  })
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    requirement: z.string().min(10).optional(),
    status: z.enum(["Draft", "Planning", "Active", "Completed", "Archived"]).optional()
  })
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) })
});
