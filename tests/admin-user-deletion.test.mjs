import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFileSync(path.join(root, relative), "utf8");

test("disabled users replace edit with permanent delete", () => {
  const view = source("features/admin/components/AdminUsersView.tsx");

  assert.match(view, /user\.disabled \? <button[^>]*dangerButtonClass/);
  assert.match(view, /<Trash2 size=\{15\} \/>حذف/);
  assert.match(view, /: <Link href=\{\`\/admin\/users\/\$\{user\.id\}\` as Route\}/);
  assert.match(view, /حذف برای همیشه/);
  assert.match(view, /این عملیات قابل بازگشت نیست/);
});

test("permanent delete uses the admin DELETE endpoint", () => {
  const service = source("features/admin/services/users.service.ts");
  const view = source("features/admin/components/AdminUsersView.tsx");

  assert.match(service, /import \{ adminDelete,/);
  assert.match(service, /export function deleteUser\(id: number\)/);
  assert.match(service, /adminDelete<DeleteUserResult>\(\`\/admin\/users\/\$\{segment\(id\)\}\`\)/);
  assert.match(view, /await deleteUser\(deleteTarget\.id\)/);
});

test("reactivation remains available beside delete", () => {
  const view = source("features/admin/components/AdminUsersView.tsx");

  assert.match(view, /user\.disabled \? "فعال‌سازی" : "غیرفعال‌سازی"/);
  assert.match(view, /setUserDisabled\(target\.id, !target\.disabled\)/);
});
