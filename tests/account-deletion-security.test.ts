import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as purgeDeletedPost } from "../src/app/api/cron/purge-deleted/route";

const originalCronSecret = process.env.CRON_SECRET;

afterEach(() => {
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalCronSecret;
});

describe("account deletion maintenance authorization", () => {
  it("fails closed when the cron secret is absent or too short", async () => {
    delete process.env.CRON_SECRET;
    const missing = await purgeDeletedPost(
      new NextRequest("https://pottyplay.test/api/cron/purge-deleted", { method: "POST" })
    );
    expect(missing.status).toBe(503);

    process.env.CRON_SECRET = "short";
    const short = await purgeDeletedPost(
      new NextRequest("https://pottyplay.test/api/cron/purge-deleted", { method: "POST" })
    );
    expect(short.status).toBe(503);
  });

  it("rejects requests without the configured bearer secret", async () => {
    process.env.CRON_SECRET = "test_cron_secret_for_account_deletion_123";
    const response = await purgeDeletedPost(
      new NextRequest("https://pottyplay.test/api/cron/purge-deleted", { method: "POST" })
    );
    expect(response.status).toBe(401);
  });
});
