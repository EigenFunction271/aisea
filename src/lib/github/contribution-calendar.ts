import { z } from "zod";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

/** Matches react-activity-calendar / react-github-calendar activity shape. */
export type ContributionActivity = {
  date: string;
  count: number;
  level: number;
};

const contributionLevelToLevel = (raw: string | null | undefined): number => {
  if (!raw) return 0;
  const map: Record<string, number> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };
  return map[raw] ?? 0;
};

const DaySchema = z.object({
  date: z.string(),
  contributionCount: z.number(),
  contributionLevel: z.string().optional().nullable(),
});

const ViewerPayloadSchema = z.object({
  data: z.object({
    viewer: z
      .object({
        login: z.string(),
        contributionsCollection: z.object({
          contributionCalendar: z.object({
            totalContributions: z.number(),
            weeks: z.array(
              z.object({
                contributionDays: z.array(DaySchema),
              })
            ),
          }),
        }),
      })
      .nullable(),
  }),
});

const UserPayloadSchema = z.object({
  data: z.object({
    user: z
      .object({
        contributionsCollection: z.object({
          contributionCalendar: z.object({
            totalContributions: z.number(),
            weeks: z.array(
              z.object({
                contributionDays: z.array(DaySchema),
              })
            ),
          }),
        }),
      })
      .nullable(),
  }),
});

const VIEWER_QUERY = `
query ViewerContributions {
  viewer {
    login
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
    }
  }
}
`;

const USER_QUERY = `
query UserContributions($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
    }
  }
}
`;

function flattenCalendar(
  weeks: Array<{ contributionDays: z.infer<typeof DaySchema>[] }>
): ContributionActivity[] {
  const out: ContributionActivity[] = [];
  for (const w of weeks) {
    for (const d of w.contributionDays) {
      out.push({
        date: d.date,
        count: d.contributionCount,
        level: contributionLevelToLevel(d.contributionLevel ?? undefined),
      });
    }
  }
  return out;
}

async function githubGraphql<T>(body: object, token: string): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`GitHub GraphQL: response was not JSON (${res.status})`);
  }
  if (!res.ok) {
    const msg =
      typeof json === "object" && json && "message" in json
        ? String((json as { message: string }).message)
        : res.statusText;
    throw new Error(`GitHub GraphQL ${res.status}: ${msg}`);
  }
  if (typeof json === "object" && json && "errors" in json) {
    const errs = (json as { errors?: { message: string }[] }).errors;
    if (errs?.length) {
      throw new Error(errs.map((e) => e.message).join("; "));
    }
  }
  return json as T;
}

export async function fetchViewerContributionCalendar(
  userGithubToken: string
): Promise<{ login: string; totalContributions: number; activities: ContributionActivity[] }> {
  const raw = await githubGraphql<unknown>({ query: VIEWER_QUERY }, userGithubToken);
  const parsed = ViewerPayloadSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.data.viewer) {
    throw new Error("GitHub viewer contribution response invalid");
  }
  const v = parsed.data.data.viewer;
  const cal = v.contributionsCollection.contributionCalendar;
  return {
    login: v.login,
    totalContributions: cal.totalContributions,
    activities: flattenCalendar(cal.weeks),
  };
}

export async function fetchUserContributionCalendar(
  login: string,
  pat: string
): Promise<{ totalContributions: number; activities: ContributionActivity[] }> {
  const raw = await githubGraphql<unknown>(
    { query: USER_QUERY, variables: { login } },
    pat
  );
  const parsed = UserPayloadSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.data.user) {
    throw new Error(`GitHub user "${login}" not found or contribution response invalid`);
  }
  const cal = parsed.data.data.user.contributionsCollection.contributionCalendar;
  return {
    totalContributions: cal.totalContributions,
    activities: flattenCalendar(cal.weeks),
  };
}

export const CachedActivitiesSchema = z.array(
  z.object({
    date: z.string(),
    count: z.number(),
    level: z.number().int().min(0).max(4),
  })
);
