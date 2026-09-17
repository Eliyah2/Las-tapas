import type { Unit } from "./voorraad-types";

const formatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});

const getalFormatter = new Intl.NumberFormat("nl-NL", {
  maximumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return formatter.format(value);
}

/** Hoeveelheid leesbaar maken: 12000 gram wordt "12 kg", 480 ml wordt "480 ml". */
export function formatAmount(value: number, unit: Unit): string {
  const getal = Math.abs(value);

  if (unit === "gram") {
    return getal >= 1000
      ? `${getalFormatter.format(value / 1000)} kg`
      : `${getalFormatter.format(value)} g`;
  }

  if (unit === "ml") {
    return getal >= 1000
      ? `${getalFormatter.format(value / 1000)} L`
      : `${getalFormatter.format(value)} ml`;
  }

  return `${getalFormatter.format(value)} st`;
}

/** Inkoopprijs per kilo, liter of stuk, zodat prijzen te vergelijken zijn. */
export function formatUnitPrice(costPerUnit: number, unit: Unit): string {
  if (unit === "stuk") return `${formatter.format(costPerUnit)} / stuk`;
  if (unit === "gram") return `${formatter.format(costPerUnit * 1000)} / kg`;
  return `${formatter.format(costPerUnit * 1000)} / L`;
}

/** Kort tijdstip voor het mutatielog, bijvoorbeeld "16-09 14:05". */
export function formatTijdstip(timestamp: number): string {
  const datum = new Date(timestamp);
  const dag = String(datum.getDate()).padStart(2, "0");
  const maand = String(datum.getMonth() + 1).padStart(2, "0");
  const uur = String(datum.getHours()).padStart(2, "0");
  const minuut = String(datum.getMinutes()).padStart(2, "0");
  return `${dag}-${maand} ${uur}:${minuut}`;
}

/** "+ 2,5 kg" of "- 480 ml", met het teken erbij. */
export function formatDelta(delta: number, unit: Unit): string {
  const teken = delta > 0 ? "+ " : delta < 0 ? "- " : "";
  return `${teken}${formatAmount(Math.abs(delta), unit)}`;
}
