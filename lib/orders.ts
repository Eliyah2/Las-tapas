// Bestellingen in Supabase: de tabellen orders en order_items.
//
// De vorm van de gegevens blijft precies zoals de voorkant die kent: tijdstippen
// zijn getallen (milliseconden sinds 1970) en een bestelling heeft een veld
// `table`, ook al heet die kolom in de database table_number. Daardoor hoefden
// het keukenscherm, de statuspagina en de menukaart niet aangepast te worden.
//
// Alle methodes zijn async geworden, want de database is een andere machine.

import { db, dbFout } from "@/lib/supabase";

export type OrderStatus = "nieuw" | "bereiden" | "klaar";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  /** Voor wie het gerecht is: de naam van de gast aan tafel. */
  voor?: string;
  /** Opmerking per gerecht, bijvoorbeeld "zonder ui (allergie)". */
  opmerking?: string;
};

export type Order = {
  id: string;
  table: string;
  /** De hoeveelste bestelling dit is aan deze tafel: ronde 1, 2, 3, ... */
  ronde: number;
  items: OrderItem[];
  note?: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
};

/** Eén select-string, zodat elke query dezelfde kolommen teruggeeft. */
const VELDEN =
  "id, table_number, status, note, created_at, updated_at, " +
  "order_items(id, menu_item_id, name, price, quantity)";

type ItemRij = {
  id: number | string;
  menu_item_id: string;
  name: string;
  price: number | string;
  quantity: number;
};

type OrderRij = {
  id: string;
  table_number: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  order_items: ItemRij[] | null;
};

function naarOrder(rij: OrderRij, ronde: number): Order {
  // De database geeft de regels niet gegarandeerd op invoervolgorde terug; het
  // id is een oplopend nummer, dus daar sorteren we op (zoals `order by oi.id`).
  const items = [...(rij.order_items ?? [])]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((item) => ({
      id: item.menu_item_id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
    }));

  return {
    id: rij.id,
    table: rij.table_number,
    ronde,
    items,
    note: rij.note ?? undefined,
    status: rij.status,
    createdAt: Date.parse(rij.created_at),
    updatedAt: Date.parse(rij.updated_at),
  };
}

/**
 * Het rondenummer per bestelling: de hoeveelste bestelling dit aan die tafel is
 * (ronde 1, 2, 3, ...), zodat de keuken ziet wat bij elkaar hoort.
 *
 * De database bewaart dat nummer niet: het volgt uit de volgorde waarin de
 * bestellingen van een tafel zijn geplaatst. Daarom rekenen we het hier uit,
 * oplopend op tijd en op id als twee bestellingen in dezelfde seconde zijn
 * geplaatst. De volgorde van de aangeleverde lijst blijft daarbij staan.
 */
function metRonde(rijen: OrderRij[]): Order[] {
  const perTafel = new Map<string, number>();
  const rondePerOrder = new Map<string, number>();

  const opVolgorde = [...rijen].sort((a, b) => {
    const tafelA = a.table_number.trim().toLowerCase();
    const tafelB = b.table_number.trim().toLowerCase();
    if (tafelA !== tafelB) return tafelA < tafelB ? -1 : 1;
    return (
      Date.parse(a.created_at) - Date.parse(b.created_at) ||
      a.id.localeCompare(b.id)
    );
  });

  for (const rij of opVolgorde) {
    const tafel = rij.table_number.trim().toLowerCase();
    const nummer = (perTafel.get(tafel) ?? 0) + 1;
    perTafel.set(tafel, nummer);
    rondePerOrder.set(rij.id, nummer);
  }

  return rijen.map((rij) => naarOrder(rij, rondePerOrder.get(rij.id) ?? 1));
}

/**
 * Alle bestellingen van één tafel, oud naar nieuw. Tafelnummers worden
 * hoofdletterongevoelig vergeleken: "Tafel 5" en "tafel 5" zijn dezelfde tafel.
 */
export async function ordersVoorTafel(table: string): Promise<Order[]> {
  const { data, error } = await db()
    .from("orders")
    .select(VELDEN)
    .ilike("table_number", table.trim())
    .order("created_at", { ascending: true });

  if (error) throw dbFout("Bestellingen van de tafel ophalen", error);
  return metRonde(data as unknown as OrderRij[]);
}

async function haalOrder(id: string): Promise<Order | undefined> {
  const { data, error } = await db()
    .from("orders")
    .select(VELDEN)
    .eq("id", id)
    .maybeSingle();

  if (error) throw dbFout("Bestelling ophalen", error);
  if (!data) return undefined;

  // Voor het rondenummer zijn de andere bestellingen van dezelfde tafel nodig.
  const rij = data as unknown as OrderRij;
  const vanTafel = await ordersVoorTafel(rij.table_number);
  return vanTafel.find((order) => order.id === id) ?? naarOrder(rij, 1);
}

export function orderStore() {
  return {
    async list(): Promise<Order[]> {
      const { data, error } = await db()
        .from("orders")
        .select(VELDEN)
        .order("created_at", { ascending: false });

      if (error) throw dbFout("Bestellingen ophalen", error);
      return metRonde(data as unknown as OrderRij[]);
    },

    async get(id: string): Promise<Order | undefined> {
      return haalOrder(id);
    },

    /**
     * Nieuwe bestelling, in twee stappen: eerst de bestelling, dan de regels.
     *
     * Een geneste insert (order en regels in één opdracht) weigert PostgREST
     * hier met PGRST204, ook al herkent het de relatie bij het lezen wel. Twee
     * gewone inserts werken altijd.
     *
     * Gaat het opslaan van de regels mis, dan halen we de bestelling weer weg:
     * een bestelling zonder regels is erger dan geen bestelling. Let op: dit is
     * geen echte transactie (daarvoor is een functie in de database nodig), maar
     * het ruimt zichzelf wel netjes op.
     */
    async add(input: {
      table: string;
      items: OrderItem[];
      note?: string;
    }): Promise<Order> {
      const { data: kop, error: kopFout } = await db()
        .from("orders")
        .insert({
          table_number: input.table,
          status: "nieuw",
          note: input.note?.trim() || null,
        })
        .select("id")
        .single();

      if (kopFout) throw dbFout("Bestelling opslaan", kopFout);
      const id = (kop as unknown as { id: string }).id;

      const { error: regelFout } = await db()
        .from("order_items")
        .insert(
          input.items.map((item) => ({
            order_id: id,
            menu_item_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          }))
        );

      if (regelFout) {
        await db().from("orders").delete().eq("id", id);
        throw dbFout("Orderregels opslaan", regelFout);
      }

      const order = await haalOrder(id);
      if (!order) {
        throw new Error(
          "Bestelling opslaan mislukt: de bestelling is niet terug te vinden."
        );
      }
      return order;
    },

    async updateStatus(
      id: string,
      status: OrderStatus
    ): Promise<Order | undefined> {
      // Eerst alleen het id terugvragen: bestaat de bestelling niet, dan komt er
      // geen rij terug en weten we dat het een 404 moet zijn.
      const { data, error } = await db()
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) throw dbFout("Status bijwerken", error);
      if (!data) return undefined;

      return haalOrder(id);
    },
  };
}
