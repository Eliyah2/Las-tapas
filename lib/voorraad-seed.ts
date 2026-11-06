/**
 * Beginvoorraad en recepten voor het voorraadsysteem.
 *
 * Dit bestand is met de hand bij te houden: pas hier een par-niveau, prijs,
 * leverancier of recept aan. De actuele aantallen, de mutaties en de aanvragen
 * staan in de database (Supabase); met de knop "Beginvoorraad herstellen" in het
 * scherm komt de seed hier weer bovendrijven. Zonder database gebruikt de app
 * deze lijst rechtstreeks (zie lib/inventory-lokaal.ts).
 *
 * Elke id hier moet ook in supabase/schema.sql bij de seed-insert staan, anders
 * kent de database het product of recept niet.
 */

import type { Product, Recipe } from "./voorraad-types";

export const VOORRAAD_SEED: Product[] = [
  { id: "patatas", name: "Aardappelen", unit: "gram", stock: 24000, parLevel: 20000, costPerUnit: 0.0025, supplier: "Horeca Groothandel Zuid" },
  { id: "aceite-oliva", name: "Olijfolie", unit: "ml", stock: 7500, parLevel: 6000, costPerUnit: 0.008, supplier: "Horeca Groothandel Zuid" },
  { id: "aioli", name: "Aioli", unit: "gram", stock: 2600, parLevel: 2000, costPerUnit: 0.006, supplier: "Casa Sauzen" },
  { id: "gambas", name: "Garnalen", unit: "gram", stock: 700, parLevel: 2000, costPerUnit: 0.018, supplier: "Mariscos Ibéricos" },
  { id: "knoflook", name: "Knoflook", unit: "gram", stock: 1400, parLevel: 1000, costPerUnit: 0.006, supplier: "Horeca Groothandel Zuid" },
  { id: "chili", name: "Rode chilipeper", unit: "gram", stock: 620, parLevel: 500, costPerUnit: 0.012, supplier: "Horeca Groothandel Zuid" },
  { id: "jamon", name: "Serranoham", unit: "gram", stock: 2100, parLevel: 1500, costPerUnit: 0.028, supplier: "Jamón & Co" },
  { id: "pan", name: "Brood", unit: "stuk", stock: 72, parLevel: 60, costPerUnit: 1.2, supplier: "Bakkerij Sol" },
  { id: "huevos", name: "Eieren", unit: "stuk", stock: 96, parLevel: 90, costPerUnit: 0.35, supplier: "Boerderij De Wilg" },
  { id: "arroz-bomba", name: "Bomba-rijst", unit: "gram", stock: 9600, parLevel: 8000, costPerUnit: 0.005, supplier: "Arroces Valencia" },
  { id: "azafran", name: "Saffraan", unit: "gram", stock: 9, parLevel: 30, costPerUnit: 1.5, supplier: "Especias Mancha" },
  { id: "pollo", name: "Kipfilet", unit: "gram", stock: 5200, parLevel: 4000, costPerUnit: 0.009, supplier: "Slagerij Norte" },
  { id: "mejillones", name: "Mosselen", unit: "gram", stock: 3100, parLevel: 2500, costPerUnit: 0.007, supplier: "Mariscos Ibéricos" },
  { id: "calamares", name: "Inktvisringen", unit: "gram", stock: 480, parLevel: 1500, costPerUnit: 0.014, supplier: "Mariscos Ibéricos" },
  { id: "tomate", name: "Tomaten", unit: "gram", stock: 6400, parLevel: 5000, costPerUnit: 0.003, supplier: "Horeca Groothandel Zuid" },
  { id: "cebolla", name: "Uien", unit: "gram", stock: 3600, parLevel: 3000, costPerUnit: 0.0015, supplier: "Horeca Groothandel Zuid" },
  { id: "pimenton", name: "Pimentón (paprikapoeder)", unit: "gram", stock: 520, parLevel: 400, costPerUnit: 0.02, supplier: "Especias Mancha" },
  { id: "perejil", name: "Peterselie", unit: "gram", stock: 1000, parLevel: 800, costPerUnit: 0.008, supplier: "Horeca Groothandel Zuid" },
  { id: "pimientos-padron", name: "Padrón-pepers", unit: "gram", stock: 1900, parLevel: 1500, costPerUnit: 0.012, supplier: "Horeca Groothandel Zuid" },
  { id: "limon", name: "Citroenen", unit: "stuk", stock: 52, parLevel: 40, costPerUnit: 0.45, supplier: "Horeca Groothandel Zuid" },
  { id: "nata", name: "Slagroom", unit: "ml", stock: 3100, parLevel: 2500, costPerUnit: 0.004, supplier: "Zuivel Zuid" },
  { id: "azucar", name: "Suiker", unit: "gram", stock: 2900, parLevel: 2500, costPerUnit: 0.0015, supplier: "Horeca Groothandel Zuid" },
  { id: "canela", name: "Kaneel", unit: "gram", stock: 380, parLevel: 300, costPerUnit: 0.03, supplier: "Especias Mancha" },
  { id: "chocolate", name: "Chocoladesaus", unit: "gram", stock: 2600, parLevel: 2000, costPerUnit: 0.007, supplier: "Casa Sauzen" },
  { id: "churros-deeg", name: "Churrosdeeg", unit: "gram", stock: 3900, parLevel: 3000, costPerUnit: 0.003, supplier: "Bakkerij Sol" },
  { id: "vino-tinto", name: "Rode wijn (huiswijn)", unit: "ml", stock: 12000, parLevel: 9000, costPerUnit: 0.004, supplier: "Bodega Rioja" },
  { id: "vino-blanco", name: "Witte wijn (huiswijn)", unit: "ml", stock: 9000, parLevel: 6000, costPerUnit: 0.004, supplier: "Bodega Rioja" },
  { id: "vino-rosado", name: "Roséwijn (huiswijn)", unit: "ml", stock: 6000, parLevel: 4000, costPerUnit: 0.004, supplier: "Bodega Rioja" },
  { id: "fruta-sangria", name: "Sangriafruit", unit: "gram", stock: 3800, parLevel: 3000, costPerUnit: 0.0045, supplier: "Horeca Groothandel Zuid" },
  { id: "cerveza", name: "Estrella bier 33cl", unit: "stuk", stock: 150, parLevel: 120, costPerUnit: 0.9, supplier: "Bodega Rioja" },
  { id: "agua", name: "Mineraalwater 33cl", unit: "stuk", stock: 62, parLevel: 96, costPerUnit: 0.55, supplier: "Bodega Rioja" },
  { id: "olivas", name: "Olijven", unit: "gram", stock: 3200, parLevel: 2500, costPerUnit: 0.006, supplier: "Horeca Groothandel Zuid" },
  { id: "queso", name: "Spaanse kaas", unit: "gram", stock: 2800, parLevel: 2000, costPerUnit: 0.016, supplier: "Quesos Manchegos" },
  { id: "atun", name: "Tonijn (blik)", unit: "gram", stock: 2400, parLevel: 1800, costPerUnit: 0.012, supplier: "Mariscos Ibéricos" },
  { id: "lechuga", name: "Sla", unit: "gram", stock: 1800, parLevel: 1400, costPerUnit: 0.004, supplier: "Horeca Groothandel Zuid" },
  { id: "pepino", name: "Komkommer", unit: "gram", stock: 2200, parLevel: 1600, costPerUnit: 0.002, supplier: "Horeca Groothandel Zuid" },
  { id: "vinagre", name: "Azijn", unit: "ml", stock: 3000, parLevel: 2000, costPerUnit: 0.002, supplier: "Horeca Groothandel Zuid" },
  { id: "ansjovis", name: "Ansjovis (boquerones)", unit: "gram", stock: 1600, parLevel: 1200, costPerUnit: 0.014, supplier: "Mariscos Ibéricos" },
  { id: "mayonesa", name: "Mayonaise", unit: "gram", stock: 2400, parLevel: 1800, costPerUnit: 0.005, supplier: "Casa Sauzen" },
  { id: "datiles", name: "Dadels", unit: "gram", stock: 900, parLevel: 700, costPerUnit: 0.009, supplier: "Horeca Groothandel Zuid" },
  { id: "bacon", name: "Spek", unit: "gram", stock: 1400, parLevel: 1000, costPerUnit: 0.011, supplier: "Slagerij Norte" },
  { id: "chorizo", name: "Chorizo", unit: "gram", stock: 2600, parLevel: 2000, costPerUnit: 0.013, supplier: "Jamón & Co" },
  { id: "sidra", name: "Cider", unit: "ml", stock: 2600, parLevel: 1800, costPerUnit: 0.003, supplier: "Bodega Rioja" },
  { id: "champinones", name: "Champignons", unit: "gram", stock: 2400, parLevel: 1800, costPerUnit: 0.005, supplier: "Horeca Groothandel Zuid" },
  { id: "pulpo", name: "Octopus", unit: "gram", stock: 1200, parLevel: 900, costPerUnit: 0.024, supplier: "Mariscos Ibéricos" },
  { id: "harina", name: "Bloem", unit: "gram", stock: 5000, parLevel: 4000, costPerUnit: 0.001, supplier: "Horeca Groothandel Zuid" },
  { id: "leche", name: "Melk", unit: "ml", stock: 6000, parLevel: 4000, costPerUnit: 0.0012, supplier: "Zuivel Zuid" },
  { id: "mantequilla", name: "Boter", unit: "gram", stock: 1600, parLevel: 1200, costPerUnit: 0.008, supplier: "Zuivel Zuid" },
  { id: "almendra", name: "Amandelen", unit: "gram", stock: 1200, parLevel: 900, costPerUnit: 0.018, supplier: "Especias Mancha" },
  { id: "fresa", name: "Aardbeien", unit: "gram", stock: 1400, parLevel: 1000, costPerUnit: 0.012, supplier: "Horeca Groothandel Zuid" },
  { id: "helado-vainilla", name: "Vanille-ijs", unit: "gram", stock: 3000, parLevel: 2000, costPerUnit: 0.007, supplier: "Zuivel Zuid" },
  { id: "naranja", name: "Sinaasappels", unit: "stuk", stock: 60, parLevel: 45, costPerUnit: 0.5, supplier: "Horeca Groothandel Zuid" },
  { id: "refresco", name: "Frisdrank (blikje)", unit: "stuk", stock: 120, parLevel: 96, costPerUnit: 0.7, supplier: "Bodega Rioja" },
  { id: "cafe", name: "Koffiebonen", unit: "gram", stock: 2400, parLevel: 1800, costPerUnit: 0.015, supplier: "Bodega Rioja" },
  { id: "miel", name: "Honing", unit: "gram", stock: 900, parLevel: 700, costPerUnit: 0.012, supplier: "Horeca Groothandel Zuid" },
  { id: "berenjena", name: "Aubergine", unit: "gram", stock: 1800, parLevel: 1400, costPerUnit: 0.0035, supplier: "Horeca Groothandel Zuid" },
  { id: "lomo", name: "Varkenslomo", unit: "gram", stock: 2600, parLevel: 2000, costPerUnit: 0.016, supplier: "Slagerij Norte" },
  { id: "empanada-deeg", name: "Empanadadeeg", unit: "gram", stock: 1800, parLevel: 1400, costPerUnit: 0.005, supplier: "Bakkerij Sol" },
  { id: "moruno-kruiden", name: "Morunokruiden", unit: "gram", stock: 400, parLevel: 300, costPerUnit: 0.02, supplier: "Especias Mancha" },
];

/** Wat er per gerecht uit de voorraad gaat. De bedragen gelden per portie. */
export const RECEPTEN_SEED: Recipe[] = [
  // Tapas frías
  {
    menuItemId: "aceitunas-marinadas",
    lines: [{ ingredientId: "olivas", amount: 120 }, { ingredientId: "aceite-oliva", amount: 20 }, { ingredientId: "knoflook", amount: 3 }, { ingredientId: "perejil", amount: 3 }],
  },
  {
    menuItemId: "pan-con-tomate",
    lines: [{ ingredientId: "pan", amount: 1 }, { ingredientId: "tomate", amount: 80 }, { ingredientId: "aceite-oliva", amount: 15 }],
  },
  {
    menuItemId: "tabla-de-quesos",
    lines: [{ ingredientId: "queso", amount: 150 }, { ingredientId: "pan", amount: 1 }, { ingredientId: "olivas", amount: 40 }],
  },
  {
    menuItemId: "jamon-serrano",
    lines: [{ ingredientId: "jamon", amount: 100 }],
  },
  {
    menuItemId: "ensalada-de-atun",
    lines: [{ ingredientId: "atun", amount: 80 }, { ingredientId: "lechuga", amount: 80 }, { ingredientId: "tomate", amount: 60 }, { ingredientId: "cebolla", amount: 20 }, { ingredientId: "aceite-oliva", amount: 15 }],
  },
  {
    menuItemId: "gazpacho",
    lines: [{ ingredientId: "tomate", amount: 200 }, { ingredientId: "pepino", amount: 60 }, { ingredientId: "pimenton", amount: 2 }, { ingredientId: "vinagre", amount: 10 }, { ingredientId: "aceite-oliva", amount: 15 }],
  },
  {
    menuItemId: "salmorejo",
    lines: [{ ingredientId: "tomate", amount: 200 }, { ingredientId: "pan", amount: 1 }, { ingredientId: "huevos", amount: 1 }, { ingredientId: "jamon", amount: 20 }, { ingredientId: "aceite-oliva", amount: 20 }, { ingredientId: "vinagre", amount: 5 }],
  },
  {
    menuItemId: "ensalada-mixta",
    lines: [{ ingredientId: "lechuga", amount: 100 }, { ingredientId: "tomate", amount: 70 }, { ingredientId: "huevos", amount: 1 }, { ingredientId: "olivas", amount: 30 }, { ingredientId: "aceite-oliva", amount: 15 }],
  },
  {
    menuItemId: "boquerones-en-vinagre",
    lines: [{ ingredientId: "ansjovis", amount: 120 }, { ingredientId: "vinagre", amount: 30 }, { ingredientId: "knoflook", amount: 8 }, { ingredientId: "perejil", amount: 5 }],
  },
  {
    menuItemId: "coctel-de-gambas",
    lines: [{ ingredientId: "gambas", amount: 100 }, { ingredientId: "mayonesa", amount: 40 }, { ingredientId: "lechuga", amount: 40 }, { ingredientId: "tomate", amount: 20 }],
  },

  // Tapas calientes
  {
    menuItemId: "patatas-bravas",
    lines: [{ ingredientId: "patatas", amount: 250 }, { ingredientId: "aceite-oliva", amount: 40 }, { ingredientId: "tomate", amount: 80 }, { ingredientId: "pimenton", amount: 5 }, { ingredientId: "knoflook", amount: 5 }, { ingredientId: "aioli", amount: 50 }],
  },
  {
    menuItemId: "patatas-alioli",
    lines: [{ ingredientId: "patatas", amount: 250 }, { ingredientId: "aioli", amount: 60 }, { ingredientId: "aceite-oliva", amount: 20 }],
  },
  {
    menuItemId: "gambas-al-ajillo",
    lines: [{ ingredientId: "gambas", amount: 180 }, { ingredientId: "aceite-oliva", amount: 60 }, { ingredientId: "knoflook", amount: 20 }, { ingredientId: "chili", amount: 6 }],
  },
  {
    menuItemId: "calamares-fritos",
    lines: [{ ingredientId: "calamares", amount: 180 }, { ingredientId: "harina", amount: 30 }, { ingredientId: "aceite-oliva", amount: 40 }, { ingredientId: "limon", amount: 0.25 }],
  },
  {
    menuItemId: "croquetas",
    lines: [{ ingredientId: "jamon", amount: 60 }, { ingredientId: "pan", amount: 1 }, { ingredientId: "huevos", amount: 1 }, { ingredientId: "cebolla", amount: 40 }, { ingredientId: "leche", amount: 60 }, { ingredientId: "harina", amount: 20 }],
  },
  {
    menuItemId: "datiles-con-bacon",
    lines: [{ ingredientId: "datiles", amount: 90 }, { ingredientId: "bacon", amount: 50 }],
  },
  {
    menuItemId: "alitas-de-pollo",
    lines: [{ ingredientId: "pollo", amount: 250 }, { ingredientId: "pimenton", amount: 4 }, { ingredientId: "knoflook", amount: 8 }, { ingredientId: "aceite-oliva", amount: 20 }],
  },
  {
    menuItemId: "pollo-al-ajillo",
    lines: [{ ingredientId: "pollo", amount: 220 }, { ingredientId: "knoflook", amount: 20 }, { ingredientId: "aceite-oliva", amount: 40 }, { ingredientId: "perejil", amount: 5 }],
  },
  {
    menuItemId: "chorizo-a-la-sidra",
    lines: [{ ingredientId: "chorizo", amount: 140 }, { ingredientId: "sidra", amount: 80 }],
  },
  {
    menuItemId: "chorizo-al-vino",
    lines: [{ ingredientId: "chorizo", amount: 140 }, { ingredientId: "vino-tinto", amount: 80 }],
  },
  {
    menuItemId: "pimientos",
    lines: [{ ingredientId: "pimientos-padron", amount: 180 }, { ingredientId: "aceite-oliva", amount: 30 }],
  },
  {
    menuItemId: "champinones-al-ajillo",
    lines: [{ ingredientId: "champinones", amount: 180 }, { ingredientId: "knoflook", amount: 15 }, { ingredientId: "aceite-oliva", amount: 30 }, { ingredientId: "perejil", amount: 5 }],
  },

  // Especialidades
  {
    menuItemId: "tortilla",
    lines: [{ ingredientId: "huevos", amount: 2 }, { ingredientId: "patatas", amount: 200 }, { ingredientId: "cebolla", amount: 80 }, { ingredientId: "aceite-oliva", amount: 50 }],
  },
  {
    menuItemId: "huevos-rotos",
    lines: [{ ingredientId: "huevos", amount: 2 }, { ingredientId: "patatas", amount: 200 }, { ingredientId: "jamon", amount: 60 }, { ingredientId: "aceite-oliva", amount: 40 }],
  },
  {
    menuItemId: "pinchos-morunos",
    lines: [{ ingredientId: "pollo", amount: 200 }, { ingredientId: "moruno-kruiden", amount: 5 }, { ingredientId: "aceite-oliva", amount: 15 }],
  },
  {
    menuItemId: "pulpo-a-la-gallega",
    lines: [{ ingredientId: "pulpo", amount: 180 }, { ingredientId: "patatas", amount: 150 }, { ingredientId: "pimenton", amount: 3 }, { ingredientId: "aceite-oliva", amount: 30 }],
  },
  {
    menuItemId: "mini-paella-mariscos",
    lines: [{ ingredientId: "arroz-bomba", amount: 100 }, { ingredientId: "gambas", amount: 80 }, { ingredientId: "mejillones", amount: 80 }, { ingredientId: "calamares", amount: 60 }, { ingredientId: "azafran", amount: 0.08 }, { ingredientId: "tomate", amount: 60 }, { ingredientId: "aceite-oliva", amount: 25 }],
  },
  {
    menuItemId: "mini-paella-pollo",
    lines: [{ ingredientId: "arroz-bomba", amount: 100 }, { ingredientId: "pollo", amount: 150 }, { ingredientId: "pimenton", amount: 3 }, { ingredientId: "azafran", amount: 0.08 }, { ingredientId: "tomate", amount: 60 }, { ingredientId: "aceite-oliva", amount: 25 }],
  },
  {
    menuItemId: "paella-mixta",
    lines: [{ ingredientId: "arroz-bomba", amount: 120 }, { ingredientId: "azafran", amount: 0.1 }, { ingredientId: "pollo", amount: 120 }, { ingredientId: "mejillones", amount: 100 }, { ingredientId: "calamares", amount: 80 }, { ingredientId: "tomate", amount: 100 }, { ingredientId: "pimenton", amount: 4 }, { ingredientId: "aceite-oliva", amount: 40 }],
  },
  {
    menuItemId: "empanadillas",
    lines: [{ ingredientId: "empanada-deeg", amount: 120 }, { ingredientId: "atun", amount: 60 }, { ingredientId: "tomate", amount: 30 }, { ingredientId: "cebolla", amount: 30 }],
  },
  {
    menuItemId: "berenjenas-fritas",
    lines: [{ ingredientId: "berenjena", amount: 200 }, { ingredientId: "harina", amount: 30 }, { ingredientId: "miel", amount: 25 }, { ingredientId: "aceite-oliva", amount: 40 }],
  },
  {
    menuItemId: "lomo-plancha",
    lines: [{ ingredientId: "lomo", amount: 200 }, { ingredientId: "knoflook", amount: 8 }, { ingredientId: "perejil", amount: 5 }, { ingredientId: "aceite-oliva", amount: 20 }],
  },
  {
    menuItemId: "montaditos-variados",
    lines: [{ ingredientId: "pan", amount: 2 }, { ingredientId: "jamon", amount: 40 }, { ingredientId: "queso", amount: 40 }, { ingredientId: "chorizo", amount: 40 }],
  },
  {
    menuItemId: "pan-con-alioli",
    lines: [{ ingredientId: "pan", amount: 1 }, { ingredientId: "aioli", amount: 40 }],
  },

  // Postres
  {
    menuItemId: "crema-catalana",
    lines: [{ ingredientId: "huevos", amount: 1 }, { ingredientId: "leche", amount: 120 }, { ingredientId: "azucar", amount: 40 }, { ingredientId: "canela", amount: 2 }],
  },
  {
    menuItemId: "flan",
    lines: [{ ingredientId: "huevos", amount: 2 }, { ingredientId: "leche", amount: 150 }, { ingredientId: "azucar", amount: 50 }],
  },
  {
    menuItemId: "arroz-con-leche",
    lines: [{ ingredientId: "arroz-bomba", amount: 100 }, { ingredientId: "leche", amount: 200 }, { ingredientId: "azucar", amount: 40 }, { ingredientId: "canela", amount: 2 }],
  },
  {
    menuItemId: "churros",
    lines: [{ ingredientId: "churros-deeg", amount: 180 }, { ingredientId: "chocolate", amount: 80 }, { ingredientId: "azucar", amount: 20 }, { ingredientId: "aceite-oliva", amount: 50 }],
  },
  {
    menuItemId: "tarta-de-santiago",
    lines: [{ ingredientId: "almendra", amount: 120 }, { ingredientId: "huevos", amount: 2 }, { ingredientId: "azucar", amount: 60 }, { ingredientId: "mantequilla", amount: 30 }],
  },
  {
    menuItemId: "leche-frita",
    lines: [{ ingredientId: "leche", amount: 200 }, { ingredientId: "harina", amount: 50 }, { ingredientId: "azucar", amount: 40 }, { ingredientId: "huevos", amount: 1 }, { ingredientId: "aceite-oliva", amount: 40 }],
  },
  {
    menuItemId: "helado-de-vainilla",
    lines: [{ ingredientId: "helado-vainilla", amount: 120 }],
  },
  {
    menuItemId: "natillas",
    lines: [{ ingredientId: "leche", amount: 150 }, { ingredientId: "huevos", amount: 1 }, { ingredientId: "azucar", amount: 40 }, { ingredientId: "canela", amount: 2 }],
  },
  {
    menuItemId: "fresas-con-nata",
    lines: [{ ingredientId: "fresa", amount: 120 }, { ingredientId: "nata", amount: 80 }, { ingredientId: "azucar", amount: 15 }],
  },

  // Bebidas
  { menuItemId: "tinto", lines: [{ ingredientId: "vino-tinto", amount: 150 }] },
  { menuItemId: "vino-blanco", lines: [{ ingredientId: "vino-blanco", amount: 150 }] },
  { menuItemId: "vino-rosado", lines: [{ ingredientId: "vino-rosado", amount: 150 }] },
  {
    menuItemId: "sangria",
    lines: [{ ingredientId: "vino-tinto", amount: 150 }, { ingredientId: "fruta-sangria", amount: 100 }, { ingredientId: "limon", amount: 0.25 }],
  },
  {
    menuItemId: "tinto-de-verano",
    lines: [{ ingredientId: "vino-tinto", amount: 100 }, { ingredientId: "refresco", amount: 1 }, { ingredientId: "limon", amount: 0.25 }],
  },
  { menuItemId: "cerveza", lines: [{ ingredientId: "cerveza", amount: 1 }] },
  { menuItemId: "agua", lines: [{ ingredientId: "agua", amount: 1 }] },
  { menuItemId: "refrescos", lines: [{ ingredientId: "refresco", amount: 1 }] },
  { menuItemId: "zumo-de-naranja", lines: [{ ingredientId: "naranja", amount: 2 }] },
  { menuItemId: "cafe-solo", lines: [{ ingredientId: "cafe", amount: 8 }] },
  {
    menuItemId: "cafe-con-leche",
    lines: [{ ingredientId: "cafe", amount: 8 }, { ingredientId: "leche", amount: 100 }],
  },
  {
    menuItemId: "cortado",
    lines: [{ ingredientId: "cafe", amount: 8 }, { ingredientId: "leche", amount: 40 }],
  },
];
