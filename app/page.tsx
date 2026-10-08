import { permanentRedirect } from "next/navigation";

export default function RootPage() {
  // Permanent (308): search engines should index `/home`, not `/`, as the canonical landing page.
  permanentRedirect("/home");
}
