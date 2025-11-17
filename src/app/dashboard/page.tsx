import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import DashboardHome from "./DashboardHome";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <DashboardHome session={session} />;
}
