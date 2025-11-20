import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import InstallmentOrdersClient from "./InstallmentOrdersClient";

export default async function InstallmentOrdersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <InstallmentOrdersClient session={session} />;
}
