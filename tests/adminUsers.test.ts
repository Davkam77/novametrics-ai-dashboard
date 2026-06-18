import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webHandler } from "../api/v1/admin/users";

type Seed = {
  profiles: Array<{
    id: string;
    display_name: string;
    created_at: string;
  }>;
  platformRoles: Record<string, "admin" | "user" | undefined>;
  workspaceMemberships: Array<{
    user_id: string;
  }>;
};

type QueryState = {
  table: string;
  selectColumns: string;
  filters: Array<{ op: "eq" | "in"; column: string; value: string | string[] }>;
  orderBy: Array<{ column: string; ascending: boolean }>;
  rangeStart: number | null;
  rangeEnd: number | null;
};

function createMockClient(seed: Seed) {
  const createQuery = (table: string) => {
    const state: QueryState = {
      table,
      selectColumns: "",
      filters: [],
      orderBy: [],
      rangeStart: null,
      rangeEnd: null,
    };

    const query = {
      select(columns: string) {
        state.selectColumns = columns;
        return query;
      },
      eq(column: string, value: string) {
        state.filters.push({ op: "eq", column, value });
        return query;
      },
      in(column: string, value: string[]) {
        state.filters.push({ op: "in", column, value });
        return query;
      },
      order(column: string, options?: { ascending?: boolean }) {
        state.orderBy.push({ column, ascending: options?.ascending ?? true });
        return query;
      },
      range(start: number, end: number) {
        state.rangeStart = start;
        state.rangeEnd = end;
        return Promise.resolve(resolveQuery(seed, state));
      },
      maybeSingle: async () => resolveSingle(seed, state),
      then: (resolve: (value: unknown) => void, reject: (reason?: unknown) => void) => {
        Promise.resolve(resolveQuery(seed, state)).then(resolve, reject);
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

  return {
    data: null,
    error: null,
  };
}

function resolveQuery(seed: Seed, state: QueryState) {
  if (state.table === "profiles") {
    const rows = [...seed.profiles].sort((left, right) => {
      const createdDiff = right.created_at.localeCompare(left.created_at);
      if (createdDiff !== 0) {
        return createdDiff;
      }
      return right.id.localeCompare(left.id);
    });

    const start = state.rangeStart ?? 0;
    const end = state.rangeEnd ?? rows.length - 1;

    return {
      data: rows.slice(start, end + 1),
      count: rows.length,
      error: null,
    };
  }

  if (state.table === "platform_roles") {
    const ids = state.filters.find((item) => item.column === "user_id" && item.op === "in")?.value;
    const userIds = Array.isArray(ids) ? ids : [];

    return {
      data: userIds
        .filter((userId) => seed.platformRoles[userId])
        .map((userId) => ({ user_id: userId, role: seed.platformRoles[userId] })),
      error: null,
    };
  }

  if (state.table === "workspace_members") {
    const ids = state.filters.find((item) => item.column === "user_id" && item.op === "in")?.value;
    const userIds = Array.isArray(ids) ? ids : [];

    return {
      data: seed.workspaceMemberships.filter((row) => userIds.includes(row.user_id)),
      error: null,
    };
  }

  return {
    data: null,
    error: null,
  };
}

const mockState = vi.hoisted(() => {
  const populatedSeed: Seed = {
    profiles: [
      { id: "user-c", display_name: "Charlie", created_at: "2026-06-03T12:00:00.000Z" },
      { id: "owner-b", display_name: "Bob", created_at: "2026-06-02T12:00:00.000Z" },
      { id: "admin-a", display_name: "Alice", created_at: "2026-06-01T12:00:00.000Z" },
    ],
    platformRoles: {
      "admin-a": "admin",
      "owner-b": "user",
    },
    workspaceMemberships: [
      { user_id: "admin-a" },
      { user_id: "admin-a" },
      { user_id: "owner-b" },
      { user_id: "user-c" },
    ],
  };

  return {
    populatedClient: createMockClient(populatedSeed),
    emptyClient: createMockClient({
      profiles: [],
      platformRoles: {
        "admin-a": "admin",
      },
      workspaceMemberships: [],
    }),
  };
});

let activeClient = mockState.populatedClient;

vi.mock("../api/_lib/supabase", () => ({
  getAdminSupabaseClient: () => activeClient,
}));

describe("admin users endpoint", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00.000Z"));
  });

  afterEach(() => {
    activeClient = mockState.populatedClient;
    vi.useRealTimers();
  });

  it("rejects missing JWT with 401 JSON", async () => {
    const response = await webHandler(new Request("http://localhost/api/v1/admin/users"));

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("invalid_session");
  });

  it("rejects a normal user with 403 JSON", async () => {
    const response = await webHandler(
      new Request("http://localhost/api/v1/admin/users", {
        headers: {
          Authorization: "Bearer user-1",
        },
      }),
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });

  it("rejects a workspace owner without platform admin rights", async () => {
    const response = await webHandler(
      new Request("http://localhost/api/v1/admin/users", {
        headers: {
          Authorization: "Bearer owner-b",
        },
      }),
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("forbidden");
  });

  it("returns a paginated admin user list", async () => {
    const response = await webHandler(
      new Request("http://localhost/api/v1/admin/users?limit=2&offset=0", {
        headers: {
          Authorization: "Bearer admin-a",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = (await response.json()) as {
      items: Array<{
        user_id: string;
        display_name: string | null;
        platform_role: "admin" | "user";
        workspace_count: number;
        created_at: string;
      }>;
      limit: number;
      offset: number;
      total: number;
      next_offset: number | null;
    };

    expect(body).toEqual({
      items: [
        {
          user_id: "user-c",
          display_name: "Charlie",
          platform_role: "user",
          workspace_count: 1,
          created_at: "2026-06-03T12:00:00.000Z",
        },
        {
          user_id: "owner-b",
          display_name: "Bob",
          platform_role: "user",
          workspace_count: 1,
          created_at: "2026-06-02T12:00:00.000Z",
        },
      ],
      limit: 2,
      offset: 0,
      total: 3,
      next_offset: 2,
    });

    expect(body.items[0]).not.toHaveProperty("email");
    expect(body.items[0]).not.toHaveProperty("avatar_url");
    expect(body.items[0]).not.toHaveProperty("workspace_id");
    expect(body.items[0]).not.toHaveProperty("auth");
  });

  it("validates pagination parameters", async () => {
    const response = await webHandler(
      new Request("http://localhost/api/v1/admin/users?limit=-1&offset=abc", {
        headers: {
          Authorization: "Bearer admin-a",
        },
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe("invalid_request");
  });

  it("returns an empty list for an empty database", async () => {
    activeClient = mockState.emptyClient;

    const response = await webHandler(
      new Request("http://localhost/api/v1/admin/users", {
        headers: {
          Authorization: "Bearer admin-a",
        },
      }),
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      items: unknown[];
      total: number;
      next_offset: number | null;
    };

    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.next_offset).toBeNull();
  });
});
