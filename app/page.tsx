import { readFileSync } from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

export default function Home() {
  const html = readFileSync(path.resolve(process.cwd(), "naghshman.html"), "utf8");

  return (
    <main className="prototype-shell">
      <iframe
        className="prototype-frame"
        srcDoc={html}
        title="سامانه اجتماعی، رسانه‌ای و میدانی میدانِ خیابان"
      />
    </main>
  );
}
