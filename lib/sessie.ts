import { createHmac, timingSafeEqual } from "node:crypto";

/* Toegang tot het manageroverzicht.

   De bedrijfsleiding logt in met één pincode. Zonder eigen waarden in .env
   werkt de standaardpincode, zodat het project lokaal meteen te gebruiken is.
   De sessie is een cookie met een handtekening (HMAC), zodat niemand hem
   zomaar kan namaken; na acht uur — één dienst — verloopt hij. */

export const MANAGER_PIN = process.env.MANAGER_PIN ?? "2468";
export const SESSIE_COOKIE = "lt_manager";
export const SESSIE_SECONDEN = 8 * 60 * 60;

const GEHEIM = process.env.SESSIE_GEHEIM ?? "las-tapas-lokale-sessie";

function teken(waarde: string): string {
  return createHmac("sha256", GEHEIM).update(waarde).digest("hex");
}

function gelijk(a: string, b: string): boolean {
  const eerste = Buffer.from(a);
  const tweede = Buffer.from(b);
  return eerste.length === tweede.length && timingSafeEqual(eerste, tweede);
}

export function pinKlopt(pin: string): boolean {
  return gelijk(teken(pin.trim()), teken(MANAGER_PIN));
}

export function maakSessieWaarde(): string {
  const verloopt = String(Date.now() + SESSIE_SECONDEN * 1000);
  return `${verloopt}.${teken(verloopt)}`;
}

export function isGeldigeSessie(waarde?: string): boolean {
  if (!waarde) return false;
  const [verloopt, handtekening] = waarde.split(".");
  if (!verloopt || !handtekening) return false;
  if (!gelijk(handtekening, teken(verloopt))) return false;
  return Number(verloopt) > Date.now();
}
