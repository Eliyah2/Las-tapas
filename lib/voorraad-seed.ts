/**
 * Beginvoorraad en recepten voor het voorraadsysteem.
 *
 * Dit bestand is met de hand bij te houden: pas hier een par-niveau, prijs,
 * leverancier of recept aan. Wat er in het voorraadscherm wordt bijgehouden
 * (tellingen en mutaties) staat in `data/voorraad.json`; met de knop
 * "Beginvoorraad herstellen" in het scherm komt de seed weer bovendrijven.
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
  { id: "pan", name: "Brood (paneermeel)", unit: "stuk", stock: 72, parLevel: 60, costPerUnit: 1.2, supplier: "Bakkerij Sol" },
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
  { id: "entrecote", name: "Entrecôte", unit: "gram", stock: 6400, parLevel: 5000, costPerUnit: 0.026, supplier: "Slagerij Norte" },
  { id: "pimientos-padron", name: "Padrón-pepers", unit: "gram", stock: 1900, parLevel: 1500, costPerUnit: 0.012, supplier: "Horeca Groothandel Zuid" },
  { id: "limon", name: "Citroenen", unit: "stuk", stock: 52, parLevel: 40, costPerUnit: 0.45, supplier: "Horeca Groothandel Zuid" },
  { id: "nata", name: "Slagroom", unit: "ml", stock: 3100, parLevel: 2500, costPerUnit: 0.004, supplier: "Zuivel Zuid" },
  { id: "azucar", name: "Suiker", unit: "gram", stock: 2900, parLevel: 2500, costPerUnit: 0.0015, supplier: "Horeca Groothandel Zuid" },
  { id: "canela", name: "Kaneel", unit: "gram", stock: 380, parLevel: 300, costPerUnit: 0.03, supplier: "Especias Mancha" },
  { id: "chocolate", name: "Chocoladesaus", unit: "gram", stock: 2600, parLevel: 2000, costPerUnit: 0.007, supplier: "Casa Sauzen" },
  { id: "churros-deeg", name: "Churrosdeeg", unit: "gram", stock: 3900, parLevel: 3000, costPerUnit: 0.003, supplier: "Bakkerij Sol" },
  { id: "vino-tinto", name: "Rode wijn (huiswijn)", unit: "ml", stock: 12000, parLevel: 9000, costPerUnit: 0.004, supplier: "Bodega Rioja" },
  { id: "fruta-sangria", name: "Sangriafruit", unit: "gram", stock: 3800, parLevel: 3000, costPerUnit: 0.0045, supplier: "Horeca Groothandel Zuid" },
  { id: "cerveza", name: "Estrella bier 33cl", unit: "stuk", stock: 150, parLevel: 120, costPerUnit: 0.9, supplier: "Bodega Rioja" },
  { id: "agua", name: "Mineraalwater 33cl", unit: "stuk", stock: 62, parLevel: 96, costPerUnit: 0.55, supplier: "Bodega Rioja" },
];

/** Wat er per gerecht uit de voorraad gaat. De bedragen gelden per portie. */
export const RECEPTEN_SEED: Recipe[] = [
  {
    menuItemId: "patatas-bravas",
    lines: [
      { ingredientId: "patatas", amount: 250 },
      { ingredientId: "aceite-oliva", amount: 40 },
      { ingredientId: "tomate", amount: 80 },
      { ingredientId: "pimenton", amount: 5 },
      { ingredientId: "knoflook", amount: 5 },
      { ingredientId: "aioli", amount: 50 },
    ],
  },
  {
    menuItemId: "gambas-al-ajillo",
    lines: [
      { ingredientId: "gambas", amount: 180 },
      { ingredientId: "aceite-oliva", amount: 60 },
      { ingredientId: "knoflook", amount: 20 },
      { ingredientId: "chili", amount: 6 },
    ],
  },
  {
    menuItemId: "croquetas",
    lines: [
      { ingredientId: "jamon", amount: 60 },
      { ingredientId: "pan", amount: 1 },
      { ingredientId: "huevos", amount: 1 },
      { ingredientId: "cebolla", amount: 40 },
      { ingredientId: "aceite-oliva", amount: 40 },
    ],
  },
  {
    menuItemId: "tortilla",
    lines: [
      { ingredientId: "huevos", amount: 2 },
      { ingredientId: "patatas", amount: 200 },
      { ingredientId: "cebolla", amount: 80 },
      { ingredientId: "aceite-oliva", amount: 50 },
    ],
  },
  {
    menuItemId: "paella-mixta",
    lines: [
      { ingredientId: "arroz-bomba", amount: 120 },
      { ingredientId: "azafran", amount: 0.1 },
      { ingredientId: "pollo", amount: 180 },
      { ingredientId: "mejillones", amount: 120 },
      { ingredientId: "calamares", amount: 100 },
      { ingredientId: "tomate", amount: 100 },
      { ingredientId: "pimenton", amount: 4 },
      { ingredientId: "aceite-oliva", amount: 40 },
    ],
  },
  {
    menuItemId: "pimientos",
    lines: [
      { ingredientId: "pimientos-padron", amount: 180 },
      { ingredientId: "aceite-oliva", amount: 30 },
    ],
  },
  {
    menuItemId: "churrasco",
    lines: [
      { ingredientId: "entrecote", amount: 220 },
      { ingredientId: "perejil", amount: 10 },
      { ingredientId: "knoflook", amount: 8 },
      { ingredientId: "aceite-oliva", amount: 30 },
      { ingredientId: "patatas", amount: 150 },
    ],
  },
  {
    menuItemId: "crema-catalana",
    lines: [
      { ingredientId: "huevos", amount: 1 },
      { ingredientId: "nata", amount: 120 },
      { ingredientId: "azucar", amount: 40 },
      { ingredientId: "canela", amount: 2 },
    ],
  },
  {
    menuItemId: "churros",
    lines: [
      { ingredientId: "churros-deeg", amount: 180 },
      { ingredientId: "chocolate", amount: 80 },
      { ingredientId: "azucar", amount: 20 },
      { ingredientId: "aceite-oliva", amount: 50 },
    ],
  },
  {
    menuItemId: "sangria",
    lines: [
      { ingredientId: "vino-tinto", amount: 150 },
      { ingredientId: "fruta-sangria", amount: 100 },
      { ingredientId: "limon", amount: 0.25 },
    ],
  },
  { menuItemId: "cerveza", lines: [{ ingredientId: "cerveza", amount: 1 }] },
  { menuItemId: "tinto", lines: [{ ingredientId: "vino-tinto", amount: 150 }] },
  { menuItemId: "agua", lines: [{ ingredientId: "agua", amount: 1 }] },
];
