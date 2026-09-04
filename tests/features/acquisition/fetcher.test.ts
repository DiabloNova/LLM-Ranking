import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { CrawlError } from "../../../src/features/acquisition/domain/errors";
import { resolveCrawlPolicy } from "../../../src/features/acquisition/domain/policy";
import {
  createPinnedLookup,
  safeFetch
} from "../../../src/features/acquisition/infrastructure/http/safe-fetcher";

function listen(server: Server, host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      if (address && typeof address !== "string") {
        resolve(address.port);
      } else {
        reject(new Error("server did not bind"));
      }
    });
  });
}

export async function testFetcher(): Promise<void> {
  let remote = "";
  const server = createServer((request, response) => {
    remote = request.socket.remoteAddress ?? "";
    if (request.url === "/redirect") {
      response.writeHead(302, { location: "/final" }).end();
      return;
    }
    if (request.url === "/gzip") {
      response
        .writeHead(200, {
          "content-type": "text/plain",
          "content-encoding": "gzip"
        })
        .end("bad");
      return;
    }
    if (request.url === "/large") {
      response.writeHead(200, { "content-type": "text/plain" });
      response.write("0123456789");
      response.end("0123456789");
      return;
    }
    response
      .writeHead(200, {
        "content-type": "text/plain",
        "set-cookie": "secret=x"
      })
      .end("ok");
  });
  const port = await listen(server, "127.0.0.1");
  const policy = resolveCrawlPolicy({
    allowedContentTypes: ["text/plain"],
    maxResponseBytes: 12
  });
  const response = await safeFetch(`http://pinned.example:${port}/`, {
    policy,
    hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
  });
  assert.equal(remote, "127.0.0.1");
  assert.equal(response.body.toString(), "ok");
  assert.equal("set-cookie" in response.headers, false);
  await assert.rejects(
    () =>
      safeFetch(`http://pinned.example:${port}/gzip`, {
        policy,
        hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
      }),
    (error: unknown) =>
      error instanceof CrawlError && error.code === "CONTENT_TYPE_UNSUPPORTED"
  );
  await assert.rejects(
    () =>
      safeFetch(`http://pinned.example:${port}/large`, {
        policy: { ...policy, maxResponseBytes: 5 },
        hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
      }),
    (error: unknown) =>
      error instanceof CrawlError && error.code === "RESPONSE_TOO_LARGE"
  );
  await assert.rejects(
    () =>
      safeFetch(`http://pinned.example:${port}/redirect`, {
        policy: { ...policy, maxRedirects: 0 },
        hostValidator: async () => ({ ok: true, ips: ["127.0.0.1"] })
      }),
    (error: unknown) =>
      error instanceof CrawlError && error.code === "REDIRECT_LIMIT"
  );
  await new Promise<void>(resolve => server.close(() => resolve()));

  const lookup = createPinnedLookup(["127.0.0.1", "::1"]);
  await new Promise<void>((resolve, reject) =>
    lookup("x", { all: true }, (error, addresses) => {
      if (error) {
        reject(error);
      } else {
        assert.equal(Array.isArray(addresses), true);
        resolve();
      }
    })
  );
  await new Promise<void>((resolve, reject) =>
    lookup("x", { all: false }, (error, address, family) => {
      if (error) {
        reject(error);
      } else {
        assert.equal(address, "127.0.0.1");
        assert.equal(family, 4);
        resolve();
      }
    })
  );
}
