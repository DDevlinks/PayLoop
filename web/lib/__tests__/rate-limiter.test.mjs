import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryRateLimiter } from "../rate-limiter.ts";

const TEST_CONFIG = {
  perIpLimitPerHour: 3,
  globalDailyCapTokens: 1_000_000_000n,
};

function newLimiter() {
  return new InMemoryRateLimiter(TEST_CONFIG);
}

test("allows the first mint for a new IP and address", async () => {
  const limiter = newLimiter();
  assert.equal(await limiter.checkLimit("192.168.1.1", "GADDRESS1"), null);
});

test("blocks a second mint to the same address within the window", async () => {
  const limiter = newLimiter();
  const ip = "192.168.1.1";
  const address = "GADDRESS1";

  assert.equal(await limiter.checkLimit(ip, address), null);
  await limiter.recordMint(ip, address, 5_000_000_000n);

  const result = await limiter.checkLimit(ip, address);
  assert.notEqual(result, null);
  assert.ok(result > 0);
});

test("enforces the per-IP limit", async () => {
  const limiter = newLimiter();
  const ip = "192.168.1.1";
  const addresses = ["GADDRESS1", "GADDRESS2", "GADDRESS3", "GADDRESS4"];

  for (let i = 0; i < TEST_CONFIG.perIpLimitPerHour; i++) {
    assert.equal(await limiter.checkLimit(ip, addresses[i]), null);
    await limiter.recordMint(ip, addresses[i], 5_000_000_000n);
  }

  assert.notEqual(await limiter.checkLimit(ip, addresses[3]), null);
});

test("tracks different IPs independently", async () => {
  const limiter = newLimiter();

  assert.equal(await limiter.checkLimit("192.168.1.1", "GADDRESS1"), null);
  await limiter.recordMint("192.168.1.1", "GADDRESS1", 5_000_000_000n);

  assert.equal(await limiter.checkLimit("192.168.1.2", "GADDRESS2"), null);
  await limiter.recordMint("192.168.1.2", "GADDRESS2", 5_000_000_000n);
});

test("tracks the running daily total", async () => {
  const limiter = newLimiter();

  assert.equal(await limiter.getDailyTotal(), 0n);
  await limiter.recordMint("192.168.1.1", "GADDRESS1", 5_000_000_000n);
  assert.equal(await limiter.getDailyTotal(), 5_000_000_000n);
  await limiter.recordMint("192.168.1.2", "GADDRESS2", 3_000_000_000n);
  assert.equal(await limiter.getDailyTotal(), 8_000_000_000n);
});
