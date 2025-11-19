import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Only admin can access
  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  return <UsersClient session={session} />;
}
