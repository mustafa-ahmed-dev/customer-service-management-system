import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import InactiveCouponsClient from "./InactiveCouponsClient";

export default async function InactiveCouponsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>
        Inactive Coupons
      </h1>
      <InactiveCouponsClient session={session} />
    </div>
  );
}
