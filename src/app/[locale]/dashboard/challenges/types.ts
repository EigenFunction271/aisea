export type DifficultyLevel = "starter" | "builder" | "hardcore";

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
  start_at: string;
  end_at: string;
  difficulty: DifficultyLevel | null;
  enrollment_state: "not_enrolled" | "enrolled" | "submitted" | "closed" | "archived";
  enrollment_count: number;
};

export type UserChallengeAccess = {
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isAdmin: boolean;
};
