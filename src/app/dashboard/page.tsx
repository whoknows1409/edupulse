import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  const destination = session.user.role === "ADMIN" ? "/admin" : "/student";
  redirect(destination);
}
