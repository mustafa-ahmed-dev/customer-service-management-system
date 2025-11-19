import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import CancelledOrdersClient from "./CancelledOrdersClient";

export default async function CancelledOrdersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <CancelledOrdersClient session={session} />;
}
