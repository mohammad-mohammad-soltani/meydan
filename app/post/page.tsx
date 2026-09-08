import { redirect } from "next/navigation";

export default function LegacyPostPage() {
  redirect("/posts/latest");
}
