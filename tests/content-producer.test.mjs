import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadProducer() {
  const file = path.join(root, "features/content/services/content-producer.ts");
  assert.ok(existsSync(file), "content producer mapping must exist");
  return import(pathToFileURL(file).href);
}

test("a user producer takes precedence over a different legacy creator", async () => {
  const { contentProducer } = await loadProducer();

  const producer = contentProducer(
    {
      type: "user",
      id: "usr_42",
      display_name: "نویسندهٔ روایت",
      avatar_url: "https://cdn.example/user.jpg",
    },
    [{ name: "تولیدکنندهٔ قدیمی", role: "نویسنده", avatar_url: "https://cdn.example/old.jpg" }],
  );

  assert.deepEqual(producer, {
    name: "نویسندهٔ روایت",
    role: "تولیدکننده محتوا",
    avatar: "https://cdn.example/user.jpg",
    profileHref: "/users/user/42",
    bio: "",
    publishedCount: "",
  });
});

test("a square producer is shown as the square itself", async () => {
  const { contentProducer } = await loadProducer();

  const producer = contentProducer({
    type: "square",
    id: "sq_136",
    display_name: "میدان آزادی",
    avatar_url: "https://cdn.example/square.jpg",
  });

  assert.equal(producer.name, "میدان آزادی");
  assert.equal(producer.role, "میدان");
  assert.equal(producer.avatar, "https://cdn.example/square.jpg");
  assert.equal(producer.profileHref, "/users/square/136");
});

test("legacy creators and an empty content row retain their fallbacks", async () => {
  const { contentProducer } = await loadProducer();

  assert.deepEqual(
    contentProducer(undefined, [
      { name: "تولیدکنندهٔ قدیمی", role: "پژوهشگر", bio: "معرفی", avatar_url: "https://cdn.example/old.jpg" },
    ]),
    {
      name: "تولیدکنندهٔ قدیمی",
      role: "پژوهشگر",
      avatar: "https://cdn.example/old.jpg",
      profileHref: undefined,
      bio: "معرفی",
      publishedCount: "",
    },
  );

  assert.deepEqual(contentProducer(), {
    name: "میدان خیابان",
    role: "تولیدکننده محتوا",
    avatar: undefined,
    profileHref: undefined,
    bio: "",
    publishedCount: "",
  });
});

test("the content detail makes an actor producer name a profile link", () => {
  const view = readFileSync(
    path.join(root, "features/content/components/ContentDetailView.tsx"),
    "utf8",
  );

  assert.match(view, /item\.creator\.profileHref/);
  assert.match(view, /<Link\s+href=\{item\.creator\.profileHref as Route\}/);
});
