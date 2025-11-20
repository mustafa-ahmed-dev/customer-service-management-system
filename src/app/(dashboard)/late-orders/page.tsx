import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import LateOrdersClient from "./LateOrdersClient";

export default async function LateOrdersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <LateOrdersClient session={session} />;
}
