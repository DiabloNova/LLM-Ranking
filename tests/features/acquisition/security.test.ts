import assert from "node:assert/strict";
import { isBlockedIp, resolveAndValidateHost } from "../../../src/features/acquisition/infrastructure/security/ssrf-guard";

export async function testSecurity(): Promise<void> {
  for (const ip of [
    "0.0.0.0", "10.1.1.1", "100.64.0.1", "127.0.0.1",
    "169.254.169.254", "172.16.0.1", "192.0.2.1", "192.168.1.1",
    "198.18.0.1", "224.0.0.1", "240.0.0.1", "::", "::1",
    "fc00::1", "fe80::1", "ff02::1", "ff00::1", "2001:db8::1",
    "::ffff:127.0.0.1", "::127.0.0.1", "2130706433", "0177.0.0.1"
  ]) {
    assert.equal(isBlockedIp(ip).blocked, true, ip);
  }
  assert.equal(isBlockedIp("2606:4700::1111").blocked, false);
  assert.equal(isBlockedIp("::ffff:8.8.8.8").blocked, false);
  assert.equal(isBlockedIp("::").rule, "unspecified");
  assert.equal(isBlockedIp("::1").rule, "loopback");
  assert.equal(isBlockedIp("::ffff:127.0.0.1").rule, "mapped-loopback");
  assert.equal(isBlockedIp("64:ff9b::7f00:1").rule, "nat64");
  for (const host of [
    "localhost", "a.localhost", "x.internal", "x.lan",
    "x.home.arpa", "singlelabel"
  ]) {
    const result = await resolveAndValidateHost(host, async () => []);
    assert.equal(result.ok, false, host);
  }
  const dnsFailure = await resolveAndValidateHost(
    "missing.example",
    async () => {
      throw new Error("NXDOMAIN");
    }
  );
  assert.equal(dnsFailure.ok, false);
  if (!dnsFailure.ok) {
    assert.equal(dnsFailure.error.code, "DNS_FAILURE");
  }
  const mixed = await resolveAndValidateHost(
    "mixed.example",
    async () => [
      { address: "2606:4700::1111", family: 6 },
      { address: "10.0.0.1", family: 4 }
    ]
  );
  assert.equal(mixed.ok, false);
}
