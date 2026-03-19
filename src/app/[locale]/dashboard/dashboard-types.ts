export type LiveChallenge = {
  id: string;
  title: string;
  subtitle: string;
  hero_image_url: string | null;
  end_at: string;
  reward_text: string;
  enrollment_state: "not_enrolled" | "enrolled" | "submitted";
  enrollment_count: number;
};

export type ActivityItem = {
  id: string;
  type: "enrolled" | "submitted";
  challengeTitle: string;
  challengeId: string;
  timestamp: string;
};
