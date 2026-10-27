export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // in euros
  category: string;
  available: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  /** Spaanse of Nederlandse ondertitel onder de categoriekop. */
  subtitle?: string;
  items: MenuItem[];
};

/**
 * Eén gerecht op de kaart. De prijs staat niet meer op de menukaart voor de
 * gast, maar wordt nog wel gebruikt voor de rekening: pas hem hier aan.
 */
function gerecht(
  id: string,
  name: string,
  description: string,
  price: number,
  category: string
): MenuItem {
  return { id, name, description, price, category, available: true };
}

export const MENU: MenuCategory[] = [
  {
    id: "tapas-frias",
    name: "Tapas frías",
    items: [
      gerecht(
        "aceitunas-marinadas",
        "Aceitunas marinadas",
        "Gemarineerde olijven met olijfolie, knoflook en kruiden",
        3.75,
        "Tapas frías"
      ),
      gerecht(
        "pan-con-tomate",
        "Pan con tomate",
        "Geroosterd brood met verse tomaat, olijfolie en zout",
        3.5,
        "Tapas frías"
      ),
      gerecht(
        "tabla-de-quesos",
        "Tabla de quesos españoles",
        "Selectie van Spaanse kazen zoals manchego en geitenkaas",
        9.5,
        "Tapas frías"
      ),
      gerecht(
        "jamon-serrano",
        "Jamón serrano",
        "Gedroogde Spaanse ham met een zoute, rijke smaak",
        8.5,
        "Tapas frías"
      ),
      gerecht(
        "ensalada-de-atun",
        "Ensalada de atún",
        "Tonijnsalade met ui, tomaat en olijfolie",
        7.5,
        "Tapas frías"
      ),
      gerecht(
        "gazpacho",
        "Gazpacho",
        "Koude soep van tomaat, paprika en komkommer",
        5.5,
        "Tapas frías"
      ),
      gerecht(
        "salmorejo",
        "Salmorejo",
        "Dikke koude tomatensoep met brood, ei en ham",
        5.5,
        "Tapas frías"
      ),
      gerecht(
        "ensalada-mixta",
        "Ensalada mixta",
        "Gemengde salade met sla, tomaat, ei en olijven",
        6.5,
        "Tapas frías"
      ),
      gerecht(
        "boquerones-en-vinagre",
        "Boquerones en vinagre",
        "Ansjovis gemarineerd in azijn en knoflook",
        7.0,
        "Tapas frías"
      ),
      gerecht(
        "coctel-de-gambas",
        "Cóctel de gambas",
        "Garnalen met een romige cocktailsaus",
        8.0,
        "Tapas frías"
      ),
    ],
  },
  {
    id: "tapas-calientes",
    name: "Tapas calientes",
    items: [
      gerecht(
        "patatas-bravas",
        "Patatas bravas",
        "Gebakken aardappelen met pittige saus",
        6.5,
        "Tapas calientes"
      ),
      gerecht(
        "patatas-alioli",
        "Patatas alioli",
        "Aardappelen met knoflooksaus",
        5.5,
        "Tapas calientes"
      ),
      gerecht(
        "gambas-al-ajillo",
        "Gambas al ajillo",
        "Garnalen gebakken in knoflook en olie",
        9.0,
        "Tapas calientes"
      ),
      gerecht(
        "calamares-fritos",
        "Calamares fritos",
        "Gefrituurde inktvisringen",
        8.0,
        "Tapas calientes"
      ),
      gerecht(
        "croquetas",
        "Croquetas",
        "Gefrituurde kroketjes gevuld met ham, kaas of kip",
        7.5,
        "Tapas calientes"
      ),
      gerecht(
        "datiles-con-bacon",
        "Dátiles con bacon",
        "Dadels omwikkeld met spek",
        6.5,
        "Tapas calientes"
      ),
      gerecht(
        "alitas-de-pollo",
        "Alitas de pollo",
        "Kippenvleugels met kruiden, gefrituurd of gebakken",
        6.5,
        "Tapas calientes"
      ),
      gerecht(
        "pollo-al-ajillo",
        "Pollo al ajillo",
        "Kip gebakken met knoflook en olie",
        6.5,
        "Tapas calientes"
      ),
      gerecht(
        "chorizo-a-la-sidra",
        "Chorizo a la sidra",
        "Chorizoworst gekookt in cider",
        6.0,
        "Tapas calientes"
      ),
      gerecht(
        "chorizo-al-vino",
        "Chorizo al vino",
        "Chorizoworst bereid in rode wijnsaus",
        6.0,
        "Tapas calientes"
      ),
      gerecht(
        "pimientos",
        "Pimientos de padrón",
        "Kleine groene pepers gebakken met zout",
        6.0,
        "Tapas calientes"
      ),
      gerecht(
        "champinones-al-ajillo",
        "Champiñones al ajillo",
        "Champignons in knoflookolie",
        5.5,
        "Tapas calientes"
      ),
    ],
  },
  {
    id: "especialidades",
    name: "Especialidades",
    subtitle: "Platos típicos",
    items: [
      gerecht(
        "tortilla",
        "Tortilla española",
        "Spaanse omelet met aardappel en ui",
        5.0,
        "Especialidades"
      ),
      gerecht(
        "huevos-rotos",
        "Huevos rotos",
        "Gebakken eieren met aardappelen en ham",
        7.5,
        "Especialidades"
      ),
      gerecht(
        "pinchos-morunos",
        "Pinchos morunos",
        "Gekruide vleesspiesjes",
        7.5,
        "Especialidades"
      ),
      gerecht(
        "pulpo-a-la-gallega",
        "Pulpo a la gallega",
        "Octopus met paprikapoeder en olijfolie",
        12.5,
        "Especialidades"
      ),
      gerecht(
        "mini-paella-mariscos",
        "Mini paella de mariscos",
        "Kleine paella met zeevruchten zoals garnalen en mosselen",
        12.5,
        "Especialidades"
      ),
      gerecht(
        "mini-paella-pollo",
        "Mini paella de pollo",
        "Kleine paella met kip en groenten",
        11.0,
        "Especialidades"
      ),
      gerecht(
        "paella-mixta",
        "Paella mixta (tapa pequeña)",
        "Kleine portie paella met vlees en vis samen",
        12.5,
        "Especialidades"
      ),
      gerecht(
        "empanadillas",
        "Empanadillas",
        "Kleine gevulde deegpakketjes met vlees of vis",
        5.5,
        "Especialidades"
      ),
      gerecht(
        "berenjenas-fritas",
        "Berenjenas fritas con miel",
        "Gefrituurde aubergine met honing",
        6.5,
        "Especialidades"
      ),
      gerecht(
        "lomo-plancha",
        "Lomo a la plancha",
        "Gegrild varkensvlees",
        8.5,
        "Especialidades"
      ),
      gerecht(
        "montaditos-variados",
        "Montaditos variados",
        "Kleine broodjes met verschillende belegsoorten",
        6.5,
        "Especialidades"
      ),
      gerecht(
        "pan-con-alioli",
        "Pan con alioli",
        "Brood met knoflooksaus",
        3.5,
        "Especialidades"
      ),
    ],
  },
  {
    id: "postres",
    name: "Postres",
    items: [
      gerecht(
        "crema-catalana",
        "Crema catalana",
        "Dessert met custard en een krokante suikerlaag",
        6.5,
        "Postres"
      ),
      gerecht(
        "flan",
        "Flan",
        "Pudding van ei en karamel",
        5.0,
        "Postres"
      ),
      gerecht(
        "arroz-con-leche",
        "Arroz con leche",
        "Rijst gekookt in melk met suiker en kaneel",
        5.0,
        "Postres"
      ),
      gerecht(
        "churros",
        "Churros con chocolate",
        "Gefrituurd deeg met warme chocoladesaus",
        5.5,
        "Postres"
      ),
      gerecht(
        "tarta-de-santiago",
        "Tarta de Santiago",
        "Amandeltaart uit Spanje",
        6.0,
        "Postres"
      ),
      gerecht(
        "leche-frita",
        "Leche frita",
        "Gefrituurd melkgebak met suiker",
        5.5,
        "Postres"
      ),
      gerecht(
        "helado-de-vainilla",
        "Helado de vainilla",
        "Vanille-ijs",
        4.0,
        "Postres"
      ),
      gerecht(
        "natillas",
        "Natillas",
        "Zoete custard met kaneel",
        4.5,
        "Postres"
      ),
      gerecht(
        "fresas-con-nata",
        "Fresas con nata",
        "Aardbeien met slagroom",
        5.5,
        "Postres"
      ),
    ],
  },
  {
    id: "bebidas",
    name: "Bebidas",
    subtitle: "Bebidas típicas españolas",
    items: [
      gerecht(
        "tinto",
        "Vino tinto",
        "Rode wijn, vaak stevig en vol van smaak (bij vleesgerechten)",
        4.5,
        "Bebidas"
      ),
      gerecht(
        "vino-blanco",
        "Vino blanco",
        "Witte wijn, fris en licht (bij vis en lichte tapas)",
        4.5,
        "Bebidas"
      ),
      gerecht(
        "vino-rosado",
        "Vino rosado",
        "Rosé wijn, een frisse mix tussen rood en wit",
        4.5,
        "Bebidas"
      ),
      gerecht(
        "sangria",
        "Sangría",
        "Wijn gemengd met fruit, suiker en soms frisdrank",
        5.0,
        "Bebidas"
      ),
      gerecht(
        "tinto-de-verano",
        "Tinto de verano",
        "Rode wijn met frisdrank en ijs, een lichtere variant van sangria",
        4.5,
        "Bebidas"
      ),
      gerecht(
        "cerveza",
        "Cerveza",
        "Bier, zoals bekende Spaanse merken (bijv. Estrella)",
        3.5,
        "Bebidas"
      ),
      gerecht(
        "agua",
        "Agua mineral",
        "Mineraalwater, met of zonder koolzuur",
        2.5,
        "Bebidas"
      ),
      gerecht(
        "refrescos",
        "Refrescos",
        "Frisdranken zoals cola, sinaasappel en citroenlimonade",
        3.0,
        "Bebidas"
      ),
      gerecht(
        "zumo-de-naranja",
        "Zumo de naranja",
        "Sinaasappelsap, vaak vers geperst",
        3.75,
        "Bebidas"
      ),
      gerecht(
        "cafe-solo",
        "Café solo",
        "Sterke zwarte koffie (espresso)",
        2.5,
        "Bebidas"
      ),
      gerecht(
        "cafe-con-leche",
        "Café con leche",
        "Koffie met melk",
        2.75,
        "Bebidas"
      ),
      gerecht(
        "cortado",
        "Cortado",
        "Koffie met een klein beetje melk",
        2.5,
        "Bebidas"
      ),
    ],
  },
];

/**
 * Alcohol houdt in Nederland het hoge btw-tarief (21%), eten en
 * niet-alcoholische dranken het lage tarief (9%). De prijzen op de kaart zijn
 * inclusief btw, dus het bonnetje rekent de btw eruit.
 */
const ALCOHOLISCH = new Set([
  "tinto",
  "vino-blanco",
  "vino-rosado",
  "sangria",
  "tinto-de-verano",
  "cerveza",
]);

/** Het btw-tarief dat bij een gerecht hoort (0,09 of 0,21). */
export function btwTarief(item: MenuItem): number {
  return ALCOHOLISCH.has(item.id) ? 0.21 : 0.09;
}

export function findMenuItem(id: string): MenuItem | undefined {
  for (const category of MENU) {
    const item = category.items.find((i) => i.id === id);
    if (item) return item;
  }
  return undefined;
}
