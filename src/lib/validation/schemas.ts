import { z } from "zod";

// Every mutation endpoint validates through one of these. Nothing accepts a
// free-form object, and nothing accepts a role, organization or authorization
// claim from the client — those are reconstructed server-side.

export const CASE_CATEGORIES = [
  "safety",
  "community",
  "service",
  "infrastructure",
  "dispute",
  "other"
] as const;

export const PRIVACY_MODES = ["anonymous", "confidential", "identified"] as const;

export const LOCALES = ["en", "sw", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** Public case id, e.g. "CS-1042". */
export const caseIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^CS-\d{1,9}$/, "That doesn't look like a Civora case ID.");

/** Opaque tracking token. Length bounded so a probe can't be arbitrarily long. */
export const trackingTokenSchema = z.string().trim().min(20).max(200);

export const recoveryCodeSchema = z
  .string()
  .trim()
  .min(12)
  .max(20)
  .regex(/^[0-9A-Za-z-]+$/, "Recovery codes look like ABCD-1234-EFGH.");

const contactSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    email: z.string().trim().email("That email address doesn't look right.").max(200).optional(),
    phone: z.string().trim().max(40).optional(),
    preferredChannel: z.enum(["email", "phone", "none"]).optional()
  })
  .optional();

export const reportSubmissionSchema = z.object({
  category: z.enum(CASE_CATEGORIES),
  description: z
    .string()
    .trim()
    .min(20, "Please describe what happened in at least 20 characters.")
    .max(4000),
  locationGeneral: z.string().trim().max(200).optional(),
  coordinates: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .optional(),
  incidentAt: z.string().datetime().optional(),
  privacyMode: z.enum(PRIVACY_MODES),
  contact: contactSchema,
  /** Reporter opted in to a one-time recovery code for another device. */
  withRecoveryCode: z.boolean().optional(),
  /** Number of files the client is about to upload; the files themselves are
   *  sent separately as binary, never as base64 inside this JSON. */
  plannedEvidenceCount: z.number().int().min(0).max(6).optional()
});

export type ReportSubmission = z.infer<typeof reportSubmissionSchema>;

export const evidenceNoteSchema = z.object({
  caseId: caseIdSchema,
  token: trackingTokenSchema,
  note: z.string().trim().min(1).max(1000)
});

export const trackPairsSchema = z.object({
  pairs: z
    .array(
      z.object({
        caseId: caseIdSchema,
        token: trackingTokenSchema.optional()
      })
    )
    .min(1)
    .max(20)
});

export const trackRecoverSchema = z.object({
  caseId: caseIdSchema,
  recoveryCode: recoveryCodeSchema
});

export const requestUpdateSchema = z.object({
  caseId: caseIdSchema,
  token: trackingTokenSchema
});

export const infoResponseSchema = z.object({
  caseId: caseIdSchema,
  token: trackingTokenSchema,
  requestId: z.string().trim().min(10).max(40),
  body: z.string().trim().min(5).max(2000)
});

export const RESPONDER_ACTIONS = [
  "acknowledge",
  "assign",
  "start_progress",
  "record_action",
  "request_info",
  "add_update",
  "set_verification",
  "close",
  "reopen",
  "add_note",
  "set_publication",
  "confirm_link",
  "reject_link"
] as const;

export const responderActionSchema = z
  .object({
    caseId: caseIdSchema,
    action: z.enum(RESPONDER_ACTIONS),
    note: z.string().trim().max(2000).optional(),
    publicUpdate: z.string().trim().max(2000).optional(),
    /** null means "return to the unassigned queue". */
    orgId: z.string().trim().max(40).nullable().optional(),
    verification: z
      .enum(["unverified", "partially_verified", "documented", "conflicting"])
      .optional(),
    publicationState: z.enum(["private_case", "screening", "public_case", "restricted", "archived"]).optional(),
    publicSummary: z.string().trim().min(20).max(2000).optional(),
    linkId: z.string().trim().max(40).optional()
  })
  .strict();

export const responderLoginSchema = z
  .object({
    email: z.string().trim().email().max(200).optional(),
    password: z.string().min(1).max(200).optional(),
    /** Demo-only shared code; rejected unless demo mode is explicitly on. */
    code: z.string().trim().min(1).max(120).optional()
  })
  .refine((v) => (v.email && v.password) || v.code, {
    message: "Enter your work email and password, or the demo access code."
  });

export const civicQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z
    .enum(["all", "service", "right", "policy", "opportunity", "project", "safety", "procedure"])
    .optional(),
  level: z.enum(["federal", "state", "local"]).optional(),
  cursor: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional()
});

export const aiTextSchema = z.object({
  text: z.string().trim().min(10).max(6000),
  locale: z.enum(LOCALES)
});

export const aiTranslateSchema = z.object({
  text: z.string().trim().min(2).max(6000),
  /** Target language; "en" is a no-op and is rejected client-side. */
  locale: z.enum(LOCALES)
});
