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
  items: MenuItem[];
};

export const MENU: MenuCategory[] = [
  {
    id: "tapas",
    name: "Tapas",
    items: [
      {
        id: "patatas-bravas",
        name: "Patatas Bravas",
        description: "Krokante aardappelen met pikante tomatensaus en aioli",
        price: 6.5,
        category: "Tapas",
        available: true,
      },
      {
        id: "gambas-al-ajillo",
        name: "Gambas al Ajillo",
        description: "Garnalen in knoflook-olijfolie met chilipeper",
        price: 9.0,
        category: "Tapas",
        available: true,
      },
      {
        id: "croquetas",
        name: "Croquetas de Jamón",
        description: "Huisgemaakte kroketten met serranoham (6 stuks)",
        price: 7.5,
        category: "Tapas",
        available: true,
      },
      {
        id: "tortilla",
        name: "Tortilla Española",
        description: "Traditionele aardappel-oeuf omelet, per punt",
        price: 5.0,
        category: "Tapas",
        available: true,
      },
    ],
  },
  {
    id: "hoofdgerechten",
    name: "Hoofdgerechten",
    items: [
      {
        id: "paella-mixta",
        name: "Paella Mixta",
        description: "Paella met kip, zeevruchten en saffraanrijst",
        price: 18.5,
        category: "Hoofdgerechten",
        available: true,
      },
      {
        id: "pimientos",
        name: "Pimientos de Padrón",
        description: "Gegrilde pepers met grof zeezout",
        price: 6.0,
        category: "Hoofdgerechten",
        available: true,
      },
      {
        id: "churrasco",
        name: "Churrasco de Ternera",
        description: "Gegrilde entrecôte met chimichurri en patatas",
        price: 22.0,
        category: "Hoofdgerechten",
        available: true,
      },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    items: [
      {
        id: "crema-catalana",
        name: "Crema Catalana",
        description: "Spaanse crème brûlée met kaneel",
        price: 6.5,
        category: "Desserts",
        available: true,
      },
      {
        id: "churros",
        name: "Churros con Chocolate",
        description: "Verse churros met warme chocoladesaus",
        price: 5.5,
        category: "Desserts",
        available: true,
      },
    ],
  },
  {
    id: "dranken",
    name: "Dranken",
    items: [
      {
        id: "sangria",
        name: "Sangria (glas)",
        description: "Huisgemaakte sangria met rood wijn en fruit",
        price: 5.0,
        category: "Dranken",
        available: true,
      },
      {
        id: "cerveza",
        name: "Cerveza (Estrella)",
        description: "Spaans bier op de tap, 33cl",
        price: 3.5,
        category: "Dranken",
        available: true,
      },
      {
        id: "tinto",
        name: "Vino Tinto (glas)",
        description: "Spaans rood wijn van de tap",
        price: 4.5,
        category: "Dranken",
        available: true,
      },
      {
        id: "agua",
        name: "Agua Mineral",
        description: "Fles mineraalwater, plat of bruisend",
        price: 2.5,
        category: "Dranken",
        available: true,
      },
    ],
  },
];

export function findMenuItem(id: string): MenuItem | undefined {
  for (const category of MENU) {
    const item = category.items.find((i) => i.id === id);
    if (item) return item;
  }
  return undefined;
}
