import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSIE_COOKIE, isGeldigeSessie } from "@/lib/sessie";

/* Het manageroverzicht is alleen voor de bedrijfsleiding. Zonder geldige
   sessie gaat de bezoeker eerst naar de inlogpagina. */
export default async function ManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const winkel = await cookies();
  if (!isGeldigeSessie(winkel.get(SESSIE_COOKIE)?.value)) {
    redirect("/inloggen");
  }
  return <>{children}</>;
}
