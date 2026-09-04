import assert from "node:assert/strict";
import { normalizeUrl } from "../../../src/features/acquisition/domain/url/normalizer";

export function testUrl(): void {
  const corpus = [
    "https://example.com",
    "https://EXAMPLE.com:443/a/../b/",
    "https://example.com/a?b=2&a=1&a=0#fragment",
    "https://example.com/a?x=%2f+y",
    "https://[2606:4700::1111]/"
  ];
  for (const input of corpus) {
    const first = normalizeUrl(input);
    assert.equal(first.ok, true, input);
    if (first.ok) {
      const second = normalizeUrl(first.value.canonical);
      assert.equal(second.ok, true, input);
      if (second.ok) {
        assert.equal(second.value.canonical, first.value.canonical);
      }
    }
  }
  const result = normalizeUrl(
    "HTTPS://Example.COM:443/a/../b/?utm_source=x&z=2&z=1#fragment"
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.canonical, "https://example.com/b/?z=1&z=2");
  }
  const trackingOff = normalizeUrl("https://example.com/a?gclid=x", false);
  assert.equal(trackingOff.ok, true);
  if (trackingOff.ok) {
    assert.equal(trackingOff.value.query, "gclid=x");
  }
  assert.equal(normalizeUrl("https://user:pass@example.com").ok, false);
  assert.equal(normalizeUrl("ftp://example.com").ok, false);
  assert.equal(normalizeUrl("https://例え.テスト").ok, true);
  const ipv6 = normalizeUrl("http://[2606:4700::1111]");
  assert.equal(ipv6.ok, true);
  if (ipv6.ok) {
    assert.equal(ipv6.value.canonical, "http://[2606:4700::1111]/");
    assert.equal(normalizeUrl(ipv6.value.canonical).ok, true);
  }
}
