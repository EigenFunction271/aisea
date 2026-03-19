export type ChallengeCard = {
  id: string;
  title: string;
  subtitle: string;
  hero_image_url: string | null;
  reward_text: string;
  host_name: string;
  org_name: string;
  tags: string[];
  status: "published" | "archived";
  end_at: string;
  enrollment_state: "not_enrolled" | "enrolled" | "submitted" | "closed" | "archived";
};

export type UserChallengeAccess = {
  isAuthenticated: boolean;
  isProfileComplete: boolean;
};
