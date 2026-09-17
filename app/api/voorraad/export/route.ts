import { voorraadStore } from "@/lib/inventory";
import { voorraadNiveau } from "@/lib/voorraad-types";

export const dynamic = "force-dynamic";

function kommaGetal(waarde: number): string {
  return String(Math.round(waarde * 1000) / 1000).replace(".", ",");
}

/** GET /api/voorraad/export — de voorraad als CSV, te openen in Excel. */
export async function GET() {
  const overzicht = voorraadStore().overzicht();

  const regels = [
    "Product;Eenheid;Voorraad;Par-niveau;Status;Inkoopprijs per eenheid;Voorraadwaarde;Leverancier",
    ...overzicht.producten.map((product) =>
      [
        product.name,
        product.unit,
        kommaGetal(product.stock),
        kommaGetal(product.parLevel),
        voorraadNiveau(product),
        kommaGetal(product.costPerUnit),
        kommaGetal(product.stock * product.costPerUnit),
        product.supplier ?? "",
      ].join(";")
    ),
  ];

  // Een BOM ervoor, anders ziet Excel de accenten niet goed.
  const csv = `\uFEFF${regels.join("\r\n")}\r\n`;
  const datum = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="voorraad-las-tapas-${datum}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
