import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import CancelledOrdersClient from "./CancelledOrdersClient";
import DashboardLayoutClient from "../dashboard/DashboardLayoutClient";

export default async function CancelledOrdersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient session={session}>
      <CancelledOrdersClient session={session} />
    </DashboardLayoutClient>
  );
}
