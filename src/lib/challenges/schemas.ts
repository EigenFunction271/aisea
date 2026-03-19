import { z } from "zod";

export const challengeStatusSchema = z.enum(["draft", "published", "closed", "archived"]);
export const challengeEnrollmentStateSchema = z.enum([
  "not_enrolled",
  "enrolled",
  "submitted",
  "closed",
  "archived",
]);
export const challengeSubmissionStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const challengeAttachmentSchema = z.object({
  label: z.string().min(1).max(120),
  url: z.string().url(),
});

export const challengeWinnerSchema = z.object({
  user_id: z.string().uuid(),
  placement: z.string().min(1).max(64),
  decision_text: z.string().min(1).max(5000),
});

export const challengeSchema = z.object({
  id: z.string().uuid(),
  created_by: z.string().uuid(),
  title: z.string().min(1).max(200),
  subtitle: z.string().min(1).max(240),
  description: z.string().min(1).max(20000),
  hero_image_url: z.string().url().nullable(),
  host_name: z.string().min(1).max(200),
  org_name: z.string().min(1).max(200),
  start_at: z.string(),
  end_at: z.string(),
  timezone: z.string().min(1).max(80),
  reward_text: z.string().min(1).max(3000),
  external_link: z.string().url().nullable(),
  status: challengeStatusSchema,
  tags: z.array(z.string().min(1).max(60)).max(30),
  attachments: z.array(challengeAttachmentSchema).max(30),
  eligibility: z.string().min(1).max(10000),
  judging_rubric: z.string().min(1).max(10000),
  winners: z.array(challengeWinnerSchema).max(20),
  published_at: z.string().nullable(),
  closed_at: z.string().nullable(),
  archived_at: z.string().nullable(),
  winner_announced_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const challengeSubmissionFileSchema = z.object({
  path: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().nonnegative().max(5 * 1024 * 1024),
});

export const challengeSubmissionSchema = z.object({
  id: z.string().uuid(),
  challenge_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: challengeSubmissionStatusSchema,
  submission_url: z.string().url().nullable(),
  submission_text: z.string().max(20000).nullable(),
  submission_files: z.array(challengeSubmissionFileSchema).max(5),
  review_decision_text: z.string().max(5000).nullable(),
  reviewed_by: z.string().uuid().nullable(),
  reviewed_at: z.string().nullable(),
  submitted_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Challenge = z.infer<typeof challengeSchema>;
export type ChallengeStatus = z.infer<typeof challengeStatusSchema>;
export type ChallengeEnrollmentState = z.infer<typeof challengeEnrollmentStateSchema>;
export type ChallengeSubmissionStatus = z.infer<typeof challengeSubmissionStatusSchema>;
export type ChallengeSubmission = z.infer<typeof challengeSubmissionSchema>;
