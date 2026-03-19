"use client";

import { useState } from "react";
import { RightPanel } from "./right-panel";
import { SubmissionModal } from "./submission-modal";

type Submission = {
  project_name: string | null;
  submission_url: string | null;
  submission_text: string | null;
  repo_link: string | null;
  status: string;
  submission_files: Array<{ path: string; mime_type: string; size_bytes: number }>;
};

export function DetailActions({
  challengeId,
  challengeTitle,
  endAt,
  participantCount,
  isLocked,
  isEnrolled,
  hasSubmission,
  canSubmit,
  locale,
  initialSubmission,
}: {
  challengeId: string;
  challengeTitle: string;
  endAt: string;
  participantCount: number;
  isLocked: boolean;
  isEnrolled: boolean;
  hasSubmission: boolean;
  canSubmit: boolean;
  locale: string;
  initialSubmission: Submission | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <RightPanel
        challengeId={challengeId}
        endAt={endAt}
        participantCount={participantCount}
        isLocked={isLocked}
        isEnrolled={isEnrolled}
        hasSubmission={hasSubmission}
        canSubmit={canSubmit}
        locale={locale}
        onOpenSubmit={() => setModalOpen(true)}
      />
      <SubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        challengeId={challengeId}
        challengeTitle={challengeTitle}
        initialSubmission={initialSubmission}
        canSubmit={canSubmit}
      />
    </>
  );
}
