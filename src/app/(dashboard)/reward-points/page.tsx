import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import RewardPointsClient from "./RewardPointsClient";

export default async function RewardPointsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <RewardPointsClient session={session} />;
}
