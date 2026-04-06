import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to the public fleet dashboard by default
  redirect("/fleet");
}
