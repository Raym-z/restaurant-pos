import type { MenuCategory, MenuItem } from "../types";
import type { BranchMenuAvailability } from "../types";
import type { Money, Uuid } from "@/features/shared/domain";
import { DEFAULT_CURRENCY } from "@/lib/currency";

const ORGANIZATION_ID = "org_terrace_vine";

export const DOWNTOWN_BRANCH_ID = "branch_downtown";
export const HARBOUR_BRANCH_ID = "branch_harbour";

const ALL_BRANCH_IDS: Uuid[] = [DOWNTOWN_BRANCH_ID, HARBOUR_BRANCH_ID];

const money = (amountMinor: number): Money => ({
  amountMinor,
  currency: DEFAULT_CURRENCY,
});

interface AvailabilityOptions {
  unavailable?: Uuid[];
  /** Branch-specific price override in minor units. */
  priceOverrides?: Partial<Record<Uuid, number>>;
}

function branchAvailability({
  unavailable = [],
  priceOverrides = {},
}: AvailabilityOptions = {}): BranchMenuAvailability[] {
  return ALL_BRANCH_IDS.map((branchId) => ({
    branchId,
    isAvailable: !unavailable.includes(branchId),
    priceOverride:
      priceOverrides[branchId] === undefined ? null : money(priceOverrides[branchId] as number),
  }));
}

/** Sample menu categories with localized demo content. */
export const mockMenuCategories: MenuCategory[] = [
  {
    id: "a1000000-0000-4000-8000-000000000001",
    organizationId: ORGANIZATION_ID,
    name: "Starters & Mezze",
    description: "Shareable plates to open the table.",
    translations: {
      id: {
        name: "Pembuka & Mezze",
        description: "Hidangan berbagi untuk membuka santapan.",
      },
    },
    sortOrder: 1,
    status: "active",
    createdAt: "2026-01-12T10:00:00Z",
  },
  {
    id: "a1000000-0000-4000-8000-000000000002",
    organizationId: ORGANIZATION_ID,
    name: "Wood-Fired Mains",
    description: "Plates finished over oak and olive wood.",
    translations: {
      id: {
        name: "Hidangan Utama Bakar",
        description: "Hidangan yang dimasak di atas kayu ek dan kayu zaitun.",
      },
    },
    sortOrder: 2,
    status: "active",
    createdAt: "2026-01-12T10:05:00Z",
  },
  {
    id: "a1000000-0000-4000-8000-000000000003",
    organizationId: ORGANIZATION_ID,
    name: "Sides",
    description: "Vegetable-forward accompaniments.",
    translations: {
      id: {
        name: "Lauk Pendamping",
        description: "Pelengkap berbasis sayuran.",
      },
    },
    sortOrder: 3,
    status: "active",
    createdAt: "2026-01-12T10:08:00Z",
  },
  {
    id: "a1000000-0000-4000-8000-000000000004",
    organizationId: ORGANIZATION_ID,
    name: "Desserts",
    description: "Small, sweet finishes.",
    translations: {
      id: {
        name: "Hidangan Penutup",
        description: "Penutup manis dalam porsi kecil.",
      },
    },
    sortOrder: 4,
    status: "active",
    createdAt: "2026-01-12T10:10:00Z",
  },
  {
    id: "a1000000-0000-4000-8000-000000000005",
    organizationId: ORGANIZATION_ID,
    name: "Beverages",
    description: "House-made refreshments.",
    translations: {
      id: {
        name: "Minuman",
        description: "Minuman segar buatan rumah.",
      },
    },
    sortOrder: 5,
    status: "active",
    createdAt: "2026-01-12T10:12:00Z",
  },
];

const starters = "a1000000-0000-4000-8000-000000000001";
const mains = "a1000000-0000-4000-8000-000000000002";
const sides = "a1000000-0000-4000-8000-000000000003";
const desserts = "a1000000-0000-4000-8000-000000000004";
const beverages = "a1000000-0000-4000-8000-000000000005";

/** Sample menu items, including variants, modifiers, and branch availability. */
export const mockMenuItems: MenuItem[] = [
  {
    id: "b1000000-0000-4000-8000-000000000001",
    organizationId: ORGANIZATION_ID,
    categoryId: starters,
    name: "Charred Eggplant Dip",
    description: "Smoked eggplant, tahini, lemon, and pomegranate seeds with warm pita.",
    translations: {
      id: {
        name: "Saus Terong Bakar",
        description: "Terong asap, tahini, lemon, dan biji delima dengan pita hangat.",
      },
    },
    basePrice: money(65000),
    status: "available",
    tags: ["vegetarian"],
    variants: [],
    modifierGroups: [
      {
        id: "e1000000-0000-4000-8000-000000000001",
        name: "Bread",
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "f1000000-0000-4000-8000-000000000001",
            name: "Warm pita",
            priceDelta: money(0),
          },
          {
            id: "f1000000-0000-4000-8000-000000000002",
            name: "Gluten-free pita",
            priceDelta: money(20000),
          },
        ],
      },
    ],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T10:20:00Z",
    updatedAt: "2026-10-02T09:15:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000002",
    organizationId: ORGANIZATION_ID,
    categoryId: starters,
    name: "Crispy Halloumi",
    description: "Golden halloumi with chili crisp, honey, and mint.",
    translations: {
      id: {
        name: "Halloumi Renyah",
        description: "Halloumi keemasan dengan chili crisp, madu, dan mint.",
      },
    },
    basePrice: money(85000),
    status: "available",
    tags: ["vegetarian", "spicy"],
    variants: [],
    modifierGroups: [
      {
        id: "e1000000-0000-4000-8000-000000000002",
        name: "Extras",
        minSelections: 0,
        maxSelections: 2,
        options: [
          {
            id: "f1000000-0000-4000-8000-000000000003",
            name: "Extra honey",
            priceDelta: money(10000),
          },
          {
            id: "f1000000-0000-4000-8000-000000000004",
            name: "Extra chili crisp",
            priceDelta: money(10000),
          },
        ],
      },
    ],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T10:24:00Z",
    updatedAt: "2026-09-18T12:40:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000003",
    organizationId: ORGANIZATION_ID,
    categoryId: starters,
    name: "Saffron Arancini",
    description: "Crisp risotto spheres with saffron, mascarpone, and preserved lemon aioli.",
    translations: {
      id: {
        name: "Arancini Saffron",
        description: "Bola risotto renyah dengan saffron, mascarpone, dan aioli lemon.",
      },
    },
    basePrice: money(75000),
    status: "available",
    tags: ["vegetarian", "signature"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T10:28:00Z",
    updatedAt: "2026-08-30T16:22:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000004",
    organizationId: ORGANIZATION_ID,
    categoryId: starters,
    name: "Wood-Fired Flatbread",
    description: "Blistered flatbread with whipped ricotta, za'atar, and olive oil.",
    translations: {
      id: {
        name: "Roti Pipih Bakar",
        description: "Roti pipih dengan ricotta kocok, za'atar, dan minyak zaitun.",
      },
    },
    basePrice: money(95000),
    status: "available",
    tags: ["vegetarian"],
    variants: [
      {
        id: "d1000000-0000-4000-8000-000000000001",
        name: "Classic",
        price: money(95000),
      },
      {
        id: "d1000000-0000-4000-8000-000000000002",
        name: "Spicy soppressata",
        price: money(115000),
      },
    ],
    modifierGroups: [
      {
        id: "e1000000-0000-4000-8000-000000000003",
        name: "Add-ons",
        minSelections: 0,
        maxSelections: 2,
        options: [
          {
            id: "f1000000-0000-4000-8000-000000000005",
            name: "Extra ricotta",
            priceDelta: money(25000),
          },
        ],
      },
    ],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T10:32:00Z",
    updatedAt: "2026-10-21T11:05:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000005",
    organizationId: ORGANIZATION_ID,
    categoryId: mains,
    name: "Lamb Kofta Plate",
    description: "Charred lamb kofta, green tahini, sumac onions, and grilled pita.",
    translations: {
      id: {
        name: "Piring Kofta Domba",
        description: "Kofta domba bakar, tahini hijau, bawang sumac, dan pita panggang.",
      },
    },
    basePrice: money(145000),
    status: "available",
    tags: ["signature"],
    variants: [
      {
        id: "d1000000-0000-4000-8000-000000000003",
        name: "Single skewer",
        price: money(145000),
      },
      {
        id: "d1000000-0000-4000-8000-000000000004",
        name: "Double skewer",
        price: money(215000),
      },
    ],
    modifierGroups: [
      {
        id: "e1000000-0000-4000-8000-000000000004",
        name: "Choose a side",
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "f1000000-0000-4000-8000-000000000006",
            name: "Jeweled rice",
            priceDelta: money(0),
          },
          {
            id: "f1000000-0000-4000-8000-000000000007",
            name: "Garlic herb fries",
            priceDelta: money(15000),
          },
          {
            id: "f1000000-0000-4000-8000-000000000008",
            name: "Charred broccolini",
            priceDelta: money(25000),
          },
        ],
      },
      {
        id: "e1000000-0000-4000-8000-000000000005",
        name: "Spice level",
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "f1000000-0000-4000-8000-000000000009",
            name: "Mild",
            priceDelta: money(0),
          },
          {
            id: "f1000000-0000-4000-8000-000000000010",
            name: "Medium",
            priceDelta: money(0),
          },
          {
            id: "f1000000-0000-4000-8000-000000000011",
            name: "Hot",
            priceDelta: money(0),
          },
        ],
      },
    ],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T10:40:00Z",
    updatedAt: "2026-10-28T18:12:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000006",
    organizationId: ORGANIZATION_ID,
    categoryId: mains,
    name: "Harissa Chicken",
    description: "Half chicken roasted with harissa butter, preserved lemon, and herbs.",
    translations: {
      id: {
        name: "Ayam Harissa",
        description: "Setengah ayam panggang dengan mentega harissa, lemon, dan rempah.",
      },
    },
    basePrice: money(135000),
    status: "available",
    tags: ["spicy", "gluten-free"],
    variants: [],
    modifierGroups: [
      {
        id: "e1000000-0000-4000-8000-000000000006",
        name: "Spice level",
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "f1000000-0000-4000-8000-000000000012",
            name: "Mild",
            priceDelta: money(0),
          },
          {
            id: "f1000000-0000-4000-8000-000000000013",
            name: "Medium",
            priceDelta: money(0),
          },
          {
            id: "f1000000-0000-4000-8000-000000000014",
            name: "Hot",
            priceDelta: money(0),
          },
        ],
      },
    ],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T10:44:00Z",
    updatedAt: "2026-09-05T14:30:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000007",
    organizationId: ORGANIZATION_ID,
    categoryId: mains,
    name: "Saffron Seafood Risotto",
    description: "Carnaroli rice, saffron broth, mussels, shrimp, and charred lemon.",
    translations: {
      id: {
        name: "Risotto Seafood Saffron",
        description: "Beras carnaroli, kaldu saffron, kerang, udang, dan lemon bakar.",
      },
    },
    basePrice: money(185000),
    status: "available",
    tags: ["signature", "gluten-free"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability({
      unavailable: [HARBOUR_BRANCH_ID],
      priceOverrides: { [DOWNTOWN_BRANCH_ID]: 195000 },
    }),
    createdAt: "2026-01-12T10:48:00Z",
    updatedAt: "2026-10-30T17:45:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000008",
    organizationId: ORGANIZATION_ID,
    categoryId: mains,
    name: "Mushroom Moussaka",
    description: "Layered eggplant, wild mushrooms, béchamel, and tomato-harissa jam.",
    translations: {
      id: {
        name: "Moussaka Jamur",
        description: "Lapisan terong, jamur liar, béchamel, dan selai tomat-harissa.",
      },
    },
    basePrice: money(125000),
    status: "available",
    tags: ["vegetarian"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T10:52:00Z",
    updatedAt: "2026-08-22T10:10:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000009",
    organizationId: ORGANIZATION_ID,
    categoryId: mains,
    name: "Charred Cauliflower Steak",
    description: "Cauliflower steak with romesco, golden raisins, and toasted almonds.",
    translations: {
      id: {
        name: "Steak Kembang Kol Bakar",
        description: "Steak kembang kol dengan romesco, kismis emas, dan almond panggang.",
      },
    },
    basePrice: money(115000),
    status: "unavailable",
    tags: ["vegan", "gluten-free"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability({
      unavailable: [HARBOUR_BRANCH_ID],
    }),
    createdAt: "2026-01-12T10:56:00Z",
    updatedAt: "2026-11-06T09:25:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000010",
    organizationId: ORGANIZATION_ID,
    categoryId: sides,
    name: "Garlic Herb Fries",
    description: "Crispy fries with garlic, parsley, and lemon aioli.",
    translations: {
      id: {
        name: "Kentang Goreng Bawang Herbal",
        description: "Kentang goreng renyah dengan bawang, peterseli, dan aioli lemon.",
      },
    },
    basePrice: money(55000),
    status: "available",
    tags: ["vegetarian"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability({
      unavailable: [HARBOUR_BRANCH_ID],
    }),
    createdAt: "2026-01-12T11:00:00Z",
    updatedAt: "2026-09-14T13:50:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000011",
    organizationId: ORGANIZATION_ID,
    categoryId: sides,
    name: "Charred Broccolini",
    description: "Broccolini with chili, garlic, and toasted breadcrumbs.",
    translations: {
      id: {
        name: "Brokoli Muda Bakar",
        description: "Brokoli muda dengan cabai, bawang, dan remah roti panggang.",
      },
    },
    basePrice: money(60000),
    status: "available",
    tags: ["vegan"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T11:03:00Z",
    updatedAt: "2026-07-19T15:35:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000012",
    organizationId: ORGANIZATION_ID,
    categoryId: sides,
    name: "Jeweled Rice",
    description: "Basmati rice with barberries, pistachios, and saffron butter.",
    translations: {
      id: {
        name: "Nasi Permata",
        description: "Nasi basmati dengan barberry, pistachio, dan mentega saffron.",
      },
    },
    basePrice: money(45000),
    status: "available",
    tags: ["vegetarian", "gluten-free"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T11:06:00Z",
    updatedAt: "2026-06-11T12:00:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000013",
    organizationId: ORGANIZATION_ID,
    categoryId: desserts,
    name: "Pistachio Baklava",
    description: "Layered phyllo, pistachio, orange blossom syrup.",
    translations: {
      id: {
        name: "Baklava Pistachio",
        description: "Lapisan phyllo, pistachio, dan sirup bunga jeruk.",
      },
    },
    basePrice: money(65000),
    status: "available",
    tags: ["vegetarian"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T11:10:00Z",
    updatedAt: "2026-09-29T16:20:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000014",
    organizationId: ORGANIZATION_ID,
    categoryId: desserts,
    name: "Olive Oil Cake",
    description: "Citrus olive oil cake with whipped mascarpone.",
    translations: {
      id: {
        name: "Kue Minyak Zaitun",
        description: "Kue minyak zaitun sitrus dengan mascarpone kocok.",
      },
    },
    basePrice: money(60000),
    status: "available",
    tags: ["vegetarian"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T11:13:00Z",
    updatedAt: "2026-08-08T11:45:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000015",
    organizationId: ORGANIZATION_ID,
    categoryId: desserts,
    name: "Dark Chocolate Budino",
    description: "Silky dark chocolate pudding with olive oil and flaky sea salt.",
    translations: {
      id: {
        name: "Budino Cokelat Hitam",
        description: "Puding cokelat hitam lembut dengan minyak zaitun dan garam laut.",
      },
    },
    basePrice: money(70000),
    status: "available",
    tags: ["vegetarian", "gluten-free"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T11:16:00Z",
    updatedAt: "2026-10-12T19:30:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000016",
    organizationId: ORGANIZATION_ID,
    categoryId: beverages,
    name: "Mint Lemonade",
    description: "Fresh lemon, mint, and a touch of cane sugar.",
    translations: {
      id: {
        name: "Lemonade Mint",
        description: "Lemon segar, mint, dan sedikit gula tebu.",
      },
    },
    basePrice: money(35000),
    status: "available",
    tags: ["vegan", "gluten-free"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T11:20:00Z",
    updatedAt: "2026-05-24T09:00:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000017",
    organizationId: ORGANIZATION_ID,
    categoryId: beverages,
    name: "Cardamom Cold Brew",
    description: "Slow-steeped coffee with cardamom and oat milk.",
    translations: {
      id: {
        name: "Cold Brew Kapulaga",
        description: "Kopi seduh dingin dengan kapulaga dan susu oat.",
      },
    },
    basePrice: money(40000),
    status: "available",
    tags: ["vegan"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability(),
    createdAt: "2026-01-12T11:23:00Z",
    updatedAt: "2026-10-19T08:15:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000018",
    organizationId: ORGANIZATION_ID,
    categoryId: beverages,
    name: "Pomegranate Spritz",
    description: "Pomegranate, rosemary, and sparkling water over crushed ice.",
    translations: {
      id: {
        name: "Spritz Delima",
        description: "Delima, rosemary, dan soda dingin di atas es serut.",
      },
    },
    basePrice: money(55000),
    status: "available",
    tags: ["vegan", "gluten-free"],
    variants: [
      {
        id: "d1000000-0000-4000-8000-000000000005",
        name: "Regular",
        price: money(55000),
      },
      {
        id: "d1000000-0000-4000-8000-000000000006",
        name: "Large",
        price: money(75000),
      },
    ],
    modifierGroups: [],
    branchAvailability: branchAvailability({
      priceOverrides: { [HARBOUR_BRANCH_ID]: 60000 },
    }),
    createdAt: "2026-01-12T11:26:00Z",
    updatedAt: "2026-11-01T12:10:00Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000019",
    organizationId: ORGANIZATION_ID,
    categoryId: starters,
    name: "Summer Peach Salad",
    description: "Seasonal peach, burrata, basil, and aged balsamic.",
    translations: {
      id: {
        name: "Salad Persik Musim Panas",
        description: "Persik musiman, burrata, basil, dan balsamic tua.",
      },
    },
    basePrice: money(85000),
    status: "archived",
    tags: ["vegetarian", "gluten-free"],
    variants: [],
    modifierGroups: [],
    branchAvailability: branchAvailability({
      unavailable: [DOWNTOWN_BRANCH_ID, HARBOUR_BRANCH_ID],
    }),
    createdAt: "2026-05-02T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
];
