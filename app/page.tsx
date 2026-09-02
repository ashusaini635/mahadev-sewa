import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user?.mustChangePassword) redirect("/change-password");
  if (session.user?.role === "admin") redirect("/admin");
  redirect("/dashboard");
}

