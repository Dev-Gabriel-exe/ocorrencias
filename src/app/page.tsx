// src/app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "PROFESSOR") {
    redirect("/professor/dashboard");
  }

  redirect("/secretaria/dashboard");
}
