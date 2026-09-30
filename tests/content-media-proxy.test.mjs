import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("content media proxy accepts only trusted legacy and object-storage hosts", () => {
  const route = source("app/api/content/[contentId]/media/[attachmentId]/route.ts");

  assert.match(route, /DEFAULT_API_BASE = "https:\/\/meydanbackend\.naghshman\.ir\/wp-json\/meydan\/v1"/);
  assert.match(route, /TRUSTED_MEDIA_DOMAIN_SUFFIXES = \["naghshman\.ir", "nabzjahan\.ir"\]/);
  assert.match(route, /ARVAN_MEDIA_HOST = "naghshman-media\.s3\.ir-thr-at1\.arvanstorage\.ir"/);
  assert.match(route, /MEYDAN_MEDIA_ALLOWED_ORIGINS/);
  assert.match(route, /isTrustedMediaUrl\(mediaUrl, apiOrigin\)/);
  assert.match(route, /fetchTrustedMedia\(mediaUrl, upstreamHeaders, apiOrigin\)/);
});

test("content media proxy cannot follow a redirect to an arbitrary host", () => {
  const route = source("app/api/content/[contentId]/media/[attachmentId]/route.ts");

  assert.match(route, /redirect: "manual"/);
  assert.match(route, /if \(!isTrustedMediaUrl\(next, apiOrigin\)\)/);
  assert.match(route, /Media redirect host is not allowed/);
});
