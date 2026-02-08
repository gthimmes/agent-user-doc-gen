import { z } from 'zod';

export const portalSchema = z.object({
  baseUrl: z.string().url(),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const authSchema = z.object({
  loginUrl: z.string().optional(),
  strategy: z.enum(['form', 'manual', 'state-file']).default('manual'),
  credentials: z
    .object({
      usernameSelector: z.string().optional(),
      passwordSelector: z.string().optional(),
      submitSelector: z.string().optional(),
      usernameEnv: z.string().default('PORTAL_USERNAME'),
      passwordEnv: z.string().default('PORTAL_PASSWORD'),
    })
    .optional(),
  stateFile: z.string().optional(),
  verifySelector: z.string().optional(),
  verifyUrl: z.string().optional(),
});

export const discoverySchema = z.object({
  startPaths: z.array(z.string()).default(['/']),
  maxDepth: z.number().int().min(0).max(10).default(3),
  maxPages: z.number().int().min(1).max(500).default(50),
  includePatterns: z.array(z.string()).default(['**']),
  excludePatterns: z.array(z.string()).default([]),
  waitAfterNavigation: z.number().int().min(0).default(2000),
});

export const sectionSchema = z.object({
  name: z.string(),
  selector: z.string(),
  description: z.string().optional(),
});

export const captureSchema = z.object({
  screenshotFormat: z.enum(['png', 'jpeg']).default('png'),
  screenshotQuality: z.number().int().min(1).max(100).default(90),
  captureDir: z.string().default('.captures'),
  sections: z.array(sectionSchema).optional(),
});

export const workflowStepSchema = z.object({
  action: z.enum(['click', 'fill', 'select', 'wait', 'screenshot', 'assert', 'navigate', 'hover', 'scroll']),
  target: z.string().optional(),
  value: z.string().optional(),
  description: z.string(),
  waitAfter: z.number().int().min(0).optional(),
});

export const workflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  startPath: z.string(),
  steps: z.array(workflowStepSchema).min(1),
});

export const generationSchema = z.object({
  model: z.string().default('claude-sonnet-4-5-20250929'),
  maxTokens: z.number().int().min(100).max(16000).default(4096),
  temperature: z.number().min(0).max(1).default(0.3),
  docTypes: z.array(z.enum(['tutorial', 'reference'])).default(['tutorial', 'reference']),
  includeScreenshots: z.boolean().default(true),
  language: z.string().default('en'),
});

export const outputSchema = z.object({
  dir: z.string().default('output'),
  formats: z.array(z.enum(['markdown', 'html'])).default(['markdown', 'html']),
  screenshotDir: z.string().default('screenshots'),
  generateToc: z.boolean().default(true),
  generateIndex: z.boolean().default(true),
  siteName: z.string().default('Documentation'),
});

export const docGenConfigSchema = z.object({
  portal: portalSchema,
  auth: authSchema.default({}),
  discovery: discoverySchema.default({}),
  capture: captureSchema.default({}),
  workflows: z.array(workflowSchema).default([]),
  generation: generationSchema.default({}),
  output: outputSchema.default({}),
});

export type ValidatedConfig = z.infer<typeof docGenConfigSchema>;
