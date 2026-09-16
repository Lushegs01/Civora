import { z } from "zod";

const categories = ["safety", "community", "service", "infrastructure", "dispute", "other"] as const;
const privacy = ["anonymous", "confidential", "identified"] as const;
const evidenceKinds = ["photo", "video", "document", "note"] as const;

export const evidenceUploadSchema = z.object({
  fileName: z.string().min(1).max(180),
  mimeType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive().max(8 * 1024 * 1024),
  dataBase64: z.string().min(1).max(12 * 1024 * 1024)
});

export const reportSubmissionSchema = z.object({
  category: z.enum(categories),
  description: z.string().trim().min(20, "Please describe what happened in at least 20 characters.").max(4000),
  locationGeneral: z.string().trim().max(200).optional(),
  coordinates: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .optional(),
  incidentAt: z.string().datetime().optional(),
  privacyMode: z.enum(privacy),
  contactName: z.string().trim().max(120).optional(),
  evidence: z.array(evidenceUploadSchema).max(6).optional()
});

export type ReportSubmission = z.infer<typeof reportSubmissionSchema>;

export const addEvidenceSchema = z.object({
  caseId: z.string().trim().min(4).max(16),
  token: z.string().trim().min(16).max(80),
  note: z.string().trim().max(400).optional(),
  file: evidenceUploadSchema.optional()
});

export const requestUpdateSchema = z.object({
  caseId: z.string().trim().min(4).max(16),
  token: z.string().trim().min(16).max(80)
});

const responderActions = [
  "acknowledge",
  "assign",
  "start_progress",
  "record_action",
  "request_info",
  "add_update",
  "set_verification",
  "close",
  "add_note"
] as const;

export const responderActionSchema = z.object({
  caseId: z.string().trim().min(4).max(16),
  action: z.enum(responderActions),
  note: z.string().trim().max(1000).optional(),
  publicUpdate: z.string().trim().max(1000).optional(),
  orgId: z.string().trim().max(40).optional(),
  verification: z.enum(["unverified", "partially_verified", "documented", "conflicting"]).optional()
});

export const responderSessionSchema = z.object({ code: z.string().trim().min(1).max(80) });

export const DEMO_RESPONDER_CODE = process.env.DEMO_RESPONDER_CODE || "civora-demo";
