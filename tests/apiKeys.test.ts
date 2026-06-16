import { describe, expect, it } from "vitest";
import {
  buildKeyLastFour,
  buildKeyPrefix,
  digestApiKey,
  generateRawApiKey,
  maskApiKey,
  toApiKeyListItem,
} from "../api/_lib/apiKeys";

describe("api key helpers", () => {
  it("generates a secure NovaMetrics key format", () => {
    const key = generateRawApiKey();

    expect(key.startsWith("nvm_live_")).toBe(true);
    expect(key).toMatch(/^nvm_live_[A-Za-z0-9_-]+$/);
    expect(buildKeyPrefix(key).startsWith("nvm_live_")).toBe(true);
    expect(buildKeyLastFour(key)).toHaveLength(4);
  });

  it("derives a deterministic HMAC digest", () => {
    const digest = digestApiKey("nvm_live_test_secret");

    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digestApiKey("nvm_live_test_secret")).toBe(digest);
  });

  it("masks key metadata for list views", () => {
    expect(maskApiKey("nvm_live_abcd", "wxyz")).toBe("nvm_live_abcd…wxyz");

    const item = toApiKeyListItem({
      id: "key-1",
      workspace_id: "ws-1",
      created_by_user_id: null,
      name: "Production",
      key_prefix: "nvm_live_abcd",
      key_last_four: "wxyz",
      status: "active",
      created_at: "2026-06-17T00:00:00Z",
      last_used_at: null,
      revoked_at: null,
      revoked_by_user_id: null,
      key_digest: "a".repeat(64),
    });

    expect(item.masked_key).toBe("nvm_live_abcd…wxyz");
    expect(item.key_last_four).toBe("wxyz");
  });
});
