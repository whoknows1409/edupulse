import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";

export const requireAuth = async () => {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
};

export const requireRole = async (role: "ADMIN" | "STUDENT") => {
  const session = await requireAuth();
  if (session.user.role !== role) {
    redirect("/dashboard");
  }
  return session;
};
