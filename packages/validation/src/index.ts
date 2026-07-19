import { z } from "zod";

export const feeStatusSchema = z.enum([
  "confirmed",
  "vague",
  "hidden",
  "contradicted",
  "waived",
  "declined",
]);

export const integrationModeSchema = z.enum(["fixture", "live"]);

export const evidenceSourceKindSchema = z.enum(["transcript", "web"]);

export const jobSpecSummarySchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  homeSize: z.string().min(1),
  distanceMiles: z.number().nonnegative(),
});

export const transcriptInputSchema = z.object({
  transcriptId: z.string().min(1),
  vendorName: z.string().min(1),
  text: z.string().min(1),
  jobSpec: jobSpecSummarySchema,
});

export const evidenceSourceSchema = z
  .object({
    kind: evidenceSourceKindSchema,
    id: z.string().min(1),
    quote: z.string().min(1),
    startLine: z.number().int().positive().optional(),
    endLine: z.number().int().positive().optional(),
    title: z.string().optional(),
    url: z.string().url().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "transcript") {
      if (value.startLine === undefined || value.endLine === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Transcript evidence requires startLine and endLine",
          path: ["startLine"],
        });
      }
    }

    if (value.kind === "web" && !value.url && !value.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Web evidence requires a url or title",
        path: ["url"],
      });
    }
  });

export const extractedQuoteAssertionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  amount: z.number().nonnegative(),
  status: feeStatusSchema,
  confidence: z.number().min(0).max(1),
  evidence: evidenceSourceSchema,
  leverageEligible: z.boolean(),
});

export const vendorVerificationFindingSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(["info", "warning", "confirmed"]),
  summary: z.string().min(1),
  evidence: evidenceSourceSchema,
});

export const extractionResponseSchema = z.object({
  mode: integrationModeSchema,
  vendorName: z.string().min(1),
  assertions: z.array(extractedQuoteAssertionSchema),
  warnings: z.array(z.string()),
});

export const verificationResponseSchema = z.object({
  mode: integrationModeSchema,
  vendorName: z.string().min(1),
  findings: z.array(vendorVerificationFindingSchema),
});

export const extractAndVerifyRequestSchema = z.object({
  transcript: transcriptInputSchema,
});

export const extractAndVerifyResponseSchema = z.object({
  mode: integrationModeSchema,
  extraction: extractionResponseSchema,
  verification: verificationResponseSchema,
  mergeableAssertions: z.array(extractedQuoteAssertionSchema),
});
