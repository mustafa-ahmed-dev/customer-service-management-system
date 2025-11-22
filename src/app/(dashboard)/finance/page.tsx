import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import FinanceClient from "./FinanceClient";

export default async function FinancePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <FinanceClient session={session} />;
}
