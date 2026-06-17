import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webHandler } from "../api/v1/admin/overview";

type Seed = {
  profileCount: number;
  workspaceCount: number;
  activeApiKeyCount: number;
  platformRoles: Record<string, "admin" | "user" | undefined>;
  apiRequests: Array<{
    status: string;
    total_tokens: number;
    created_at: string;
  }>;
};

type QueryState = {
  table: string;
  isCount: boolean;
  filters: Array<{ op: "eq" | "gte"; column: string; value: string }>;
};

function createMockClient(seed: Seed) {
  const createQuery = (table: string) => {
    const queryState: QueryState = {
      table,
      isCount: false,
      filters: [],
    };

    const query = {
      select(_columns: string, options?: { count?: string; head?: boolean }) {
        queryState.isCount = options?.count === "exact" && options?.head === true;
        return query;
      },
      eq(column: string, value: string) {
        queryState.filters.push({ op: "eq", column, value });
        return query;
      },
      gte(column: string, value: string) {
        queryState.filters.push({ op: "gte", column, value });
        return query;
      },
      maybeSingle: async () => resolveSingle(seed, queryState),
      single: async () => resolveSingle(seed, queryState),
      range: async (start: number, end: number) => {
        const rows = resolveMany(seed, queryState);
        return {
          data: rows.slice(start, end + 1),
          error: null,
        };
      },
      then: (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
        Promise.resolve(resolveSelect(seed, queryState)).then(resolve, reject);
      },
    };

    return query;
  };

  return {
    auth: {
      getUser: async (token: string) => {
        if (!token || token === "invalid-token") {
          return {
            data: { user: null },
            error: { message: "Invalid or expired Supabase session." },
          };
        }

        return {
          data: {
            user: {
              id: token,
              email: `${token}@example.com`,
            },
          },
          error: null,
        };
      },
    },
    from(table: string) {
      return createQuery(table);
    },
  };
}

function resolveSingle(seed: Seed, state: QueryState) {
  if (state.table === "platform_roles") {
    const userId = state.filters.find((item) => item.column === "user_id" && item.op === "eq")?.value;
    const role = userId ? seed.platformRoles[userId] : undefined;

    return {
      data: role ? { role } : null,
      error: null,
    };
  }

  if (state.table === "profiles") {
    return {
      data: null,
      count: seed.profileCount,
      error: null,
    };
  }

  if (state.table === "workspaces") {
    return {
      data: null,
      count: seed.workspaceCount,
      error: null,
    };
  }

  if (state.table === "api_keys") {
    const active = state.filters.some(
      (item) => item.column === "status" && item.op === "eq" && item.value === "active",
    );

    return {
      data: null,
      count: active ? seed.activeApiKeyCount : 0,
      error: null,
    };
  }

  return {
    data: null,
    error: null,
  };
}

function resolveSelect(seed: Seed, state: QueryState) {
  if (state.table === "profiles") {
    return {
      data: null,
      count: seed.profileCount,
      error: null,
    };
  }

  if (state.table === "workspaces") {
    return {
      data: null,
      count: seed.workspaceCount,
      error: null,
    };
  }

  if (state.table === "api_keys") {
    const active = state.filters.some(
      (item) => item.column === "status" && item.op === "eq" && item.value === "active",
    );

    return {
      data: null,
      count: active ? seed.activeApiKeyCount : 0,
      error: null,
    };
  }

  if (state.table === "api_requests") {
    return {
      data: resolveMany(seed, state),
      error: null,
    };
  }

  return {
    data: null,
    error: null,
  };
}

function resolveMany(seed: Seed, state: QueryState) {
  if (state.table !== "api_requests") {
    return [];
  }

  const gteFilter = state.filters.find(
    (item) => item.op === "gte" && item.column === "created_at",
  );

  if (!gteFilter) {
    return [...seed.apiRequests];
  }

  return seed.apiRequests.filter((row) => row.created_at >= gteFilter.value);
}

const mockState = vi.hoisted(() => {
  const seed: Seed = {
    profileCount: 17,
    workspaceCount: 5,
    activeApiKeyCount: 4,
    platformRoles: {
      "admin-1": "admin",
      "user-1": "user",
      "owner-1": "user",
    },
    apiRequests: [
      {
        status: "success",
        total_tokens: 10,
        created_at: "2026-06-17T09:00:00.000Z",
      },
      {
        status: "failed",
        total_tokens: 0,
        created_at: "2026-06-17T10:00:00.000Z",
      },
      {
        status: "success",
        total_tokens: 30,
        created_at: "2026-06-16T15:00:00.000Z",
      },
      {
        status: "processing",
        total_tokens: 0,
        created_at: "2026-06-01T12:00:00.000Z",
      },
    ],
  };

  return {
    client: createMockClient(seed),
  };
});

vi.mock("../api/_lib/supabase", () => ({
  getAdminSupabaseClient: () => mockState.client,
}));

describe("admin overview authorization helper", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects missing JWT with 401 JSON", async () => {
    const response = await webHandler(new Request("http://localhost/api/v1/admin/overview"));

    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(body.error.code).toBe("invalid_session");
  });

  it("rejects a normal user with 403 JSON", async () => {
    const response = await webHandler(
      new Request("http://localhost/api/v1/admin/overview", {
        headers: {
          Authorization: "Bearer user-1",
        },
      }),
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(body.error.code).toBe("forbidden");
  });

  it("rejects a workspace owner without platform admin rights", async () => {
    const response = await webHandler(
      new Request("http://localhost/api/v1/admin/overview", {
        headers: {
          Authorization: "Bearer owner-1",
        },
      }),
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as {
      error: { code: string; message: string };
    };

    expect(body.error.code).toBe("forbidden");
  });

  it("returns the eight global KPI for an admin user", async () => {
    const response = await webHandler(
      new Request("http://localhost/api/v1/admin/overview", {
        headers: {
          Authorization: "Bearer admin-1",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = (await response.json()) as Record<string, number>;

    expect(body).toEqual({
      total_users: 17,
      total_workspaces: 5,
      active_api_keys: 4,
      requests_today: 2,
      requests_this_month: 4,
      tokens_this_month: 40,
      successful_requests: 2,
      failed_requests: 1,
    });
    expect(Object.keys(body)).toHaveLength(8);
    expect(body).not.toHaveProperty("email");
    expect(body).not.toHaveProperty("workspace_id");
    expect(body).not.toHaveProperty("request_content");
    expect(body).not.toHaveProperty("key_digest");
  });
});
