import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // If not logged in, redirect to login page
  redirect("/login");
}
