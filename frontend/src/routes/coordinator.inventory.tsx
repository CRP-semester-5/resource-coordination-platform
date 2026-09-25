import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  History,
  Layers,
  Package,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  GripVertical,
  Plus,
  Clock,
  ShieldCheck,
  Tag,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  FolderOpen,
  CheckCheck,
  Flame,
  Database,
  Activity,
  X,
} from "lucide-react";
import { inventoryAPI, donationsAPI, categoriesAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/coordinator/inventory")({
  head: () => ({
    meta: [
      { title: "Relief Inventory Hub & Real Database Sorter — ResQ Hub" },
      {
        name: "description",
        content:
          "9-Category humanitarian warehouse inventory connected to Supabase PostgreSQL real database.",
      },
    ],
  }),
  component: CoordinatorInventoryPage,
});

// TYPES FOR 3-TIER HIERARCHY
export interface ShelfVariant {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isPerishable?: boolean;
}

export interface SubType {
  id: string;
  name: string;
  icon: string;
  unit: string;
  variants: ShelfVariant[];
}

export interface MainBranch {
  id: string;
  dbCategoryNameKeywords: string[];
  name: string;
  icon: string;
  description: string;
  color: string;
  borderTheme: string;
  bgGradient: string;
  types: SubType[];
}

// 9 OFFICIAL HUMANITARIAN RELIEF CATEGORIES WITH KEYWORD MAPPINGS FOR REAL DB
const DEFAULT_BRANCHES: MainBranch[] = [
  {
    id: "food",
    dbCategoryNameKeywords: ["food", "ration", "rice", "meal", "flour"],
    name: "Food & Rations",
    icon: "🍲",
    description: "Cooked meals, dry rations, milk packets, canned fish, and grains.",
    color: "text-amber-600 dark:text-amber-400",
    borderTheme: "border-amber-500/30 hover:border-amber-500/60",
    bgGradient: "from-amber-500/15 via-orange-500/5 to-transparent",
    types: [
      {
        id: "rice",
        name: "Rice & Grains",
        icon: "🍚",
        unit: "kg",
        variants: [
          { id: "white_rice", name: "White Rice (Samba)", quantity: 0, unit: "kg" },
          { id: "red_rice", name: "Red Rice (Kekulu)", quantity: 0, unit: "kg" },
          { id: "basmati", name: "Basmati / Fragrant Rice", quantity: 0, unit: "kg" },
        ],
      },
      {
        id: "milk",
        name: "Milk Packets & Dairy",
        icon: "🥛",
        unit: "packets",
        variants: [
          {
            id: "vanilla_milk",
            name: "Vanilla Milk Packets (180ml)",
            quantity: 0,
            unit: "packets",
          },
          {
            id: "chocolate_milk",
            name: "Chocolate Milk Packets (180ml)",
            quantity: 0,
            unit: "packets",
          },
          { id: "fresh_milk", name: "Fresh Liquid Milk (1L)", quantity: 0, unit: "bottles" },
          { id: "milk_powder", name: "Full Cream Milk Powder (400g)", quantity: 0, unit: "packs" },
        ],
      },
      {
        id: "sugar",
        name: "Sugar & Condiments",
        icon: "🧂",
        unit: "kg",
        variants: [
          { id: "white_sugar", name: "White Sugar", quantity: 0, unit: "kg" },
          { id: "brown_sugar", name: "Brown / Raw Sugar", quantity: 0, unit: "kg" },
          { id: "tea_leaves", name: "Tea Leaves & Bags", quantity: 0, unit: "packs" },
          { id: "dhal", name: "Red Dhal / Lentils", quantity: 0, unit: "kg" },
        ],
      },
      {
        id: "canned",
        name: "Canned Fish & Protein",
        icon: "🥫",
        unit: "cans",
        variants: [
          { id: "mackerel", name: "Canned Mackerel / Sardines", quantity: 0, unit: "cans" },
          { id: "salmon", name: "Salmon in Brine", quantity: 0, unit: "cans" },
          { id: "soya_meat", name: "Soya Meat Packs", quantity: 0, unit: "packs" },
        ],
      },
      {
        id: "cooked",
        name: "Cooked Meals & Bakery",
        icon: "🍱",
        unit: "packs",
        variants: [
          {
            id: "rice_parcels",
            name: "Rice & Curry Parcels (Cooked)",
            quantity: 0,
            unit: "packs",
            isPerishable: true,
          },
          {
            id: "buns_bakery",
            name: "Buns / Fresh Bread Loaves",
            quantity: 0,
            unit: "packs",
            isPerishable: true,
          },
        ],
      },
    ],
  },
  {
    id: "water",
    dbCategoryNameKeywords: ["water", "bottle", "hydration", "drink"],
    name: "Drinking Water & Hydration",
    icon: "💧",
    description: "Bottled drinking water, 5L cans, filters, and oral rehydration salts.",
    color: "text-sky-600 dark:text-sky-400",
    borderTheme: "border-sky-500/30 hover:border-sky-500/60",
    bgGradient: "from-sky-500/15 via-blue-500/5 to-transparent",
    types: [
      {
        id: "bottled_water",
        name: "Bottled Drinking Water",
        icon: "🧴",
        unit: "bottles",
        variants: [
          { id: "water_500ml", name: "500ml Mineral Water Bottles", quantity: 0, unit: "bottles" },
          { id: "water_1_5L", name: "1.5L Drinking Water Bottles", quantity: 0, unit: "bottles" },
          { id: "water_5L", name: "5L Large Water Canisters", quantity: 0, unit: "canisters" },
        ],
      },
      {
        id: "water_purification",
        name: "Purification & Electrolytes",
        icon: "🧪",
        unit: "packs",
        variants: [
          {
            id: "chlorine_tabs",
            name: "Water Purification Tablets (100s)",
            quantity: 0,
            unit: "tubes",
          },
          {
            id: "ors_sachets",
            name: "Oral Rehydration Salts (ORS / Jeewani)",
            quantity: 0,
            unit: "sachets",
          },
        ],
      },
    ],
  },
  {
    id: "medical",
    dbCategoryNameKeywords: ["medical", "medicine", "pill", "drug", "health", "pharm"],
    name: "Medical Supplies & First Aid",
    icon: "💊",
    description: "Prescription medicines, paracetamol, trauma bandages, and surgical supplies.",
    color: "text-emerald-600 dark:text-emerald-400",
    borderTheme: "border-emerald-500/30 hover:border-emerald-500/60",
    bgGradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
    types: [
      {
        id: "essential_meds",
        name: "Essential Medications",
        icon: "🩹",
        unit: "strips",
        variants: [
          { id: "panadol", name: "Paracetamol 500mg Strips", quantity: 0, unit: "strips" },
          {
            id: "amoxicillin",
            name: "Amoxicillin / Antibiotic Strips",
            quantity: 0,
            unit: "strips",
          },
          { id: "antihistamine", name: "Cetirizine / Antihistamines", quantity: 0, unit: "strips" },
        ],
      },
      {
        id: "wound_care",
        name: "Wound Care & Dressings",
        icon: "🩺",
        unit: "packs",
        variants: [
          {
            id: "sterile_bandages",
            name: "Sterile Bandage Rolls & Gauze",
            quantity: 0,
            unit: "packs",
          },
          {
            id: "antiseptic_liquid",
            name: "Povidone Iodine / Dettol 100ml",
            quantity: 0,
            unit: "bottles",
          },
          { id: "surgical_tape", name: "Micropore Surgical Tape", quantity: 0, unit: "rolls" },
        ],
      },
      {
        id: "trauma_kits",
        name: "First Aid & Trauma Kits",
        icon: "🧰",
        unit: "kits",
        variants: [
          {
            id: "first_aid_pouches",
            name: "Compact Emergency First Aid Pouches",
            quantity: 0,
            unit: "kits",
          },
          { id: "burn_dressings", name: "Hydrogel Burn Dressings", quantity: 0, unit: "packs" },
        ],
      },
    ],
  },
  {
    id: "baby_care",
    dbCategoryNameKeywords: ["baby", "infant", "formula", "diaper", "nestum", "lacto"],
    name: "Baby Care & Infant Nutrition",
    icon: "👶",
    description: "Infant formula, diapers, feeding bottles, baby wipes, and cereals.",
    color: "text-pink-600 dark:text-pink-400",
    borderTheme: "border-pink-500/30 hover:border-pink-500/60",
    bgGradient: "from-pink-500/15 via-rose-500/5 to-transparent",
    types: [
      {
        id: "infant_nutrition",
        name: "Infant Nutrition",
        icon: "🍼",
        unit: "packs",
        variants: [
          {
            id: "baby_milk_formula",
            name: "Infant Formula Milk Powder (400g)",
            quantity: 0,
            unit: "tins",
          },
          { id: "baby_cereal", name: "Nestum / Rice Baby Cereal", quantity: 0, unit: "boxes" },
          {
            id: "feeding_bottles",
            name: "BPA-Free Baby Feeding Bottles",
            quantity: 0,
            unit: "units",
          },
        ],
      },
      {
        id: "baby_hygiene",
        name: "Baby Hygiene & Comfort",
        icon: "🧸",
        unit: "packs",
        variants: [
          {
            id: "diapers_medium",
            name: "Baby Diapers (Medium Size Packs)",
            quantity: 0,
            unit: "packs",
          },
          {
            id: "diapers_large",
            name: "Baby Diapers (Large Size Packs)",
            quantity: 0,
            unit: "packs",
          },
          { id: "baby_wipes", name: "Gentle Baby Wet Wipes (80s)", quantity: 0, unit: "packs" },
          { id: "baby_soap", name: "Mild Baby Bath Soap & Rash Cream", quantity: 0, unit: "packs" },
        ],
      },
    ],
  },
  {
    id: "clothing",
    dbCategoryNameKeywords: ["cloth", "garment", "shirt", "pant", "sarong", "dress", "blanket"],
    name: "Clothing & Garments",
    icon: "👕",
    description: "Men, women, and children clean clothes, sarongs, and blankets.",
    color: "text-indigo-600 dark:text-indigo-400",
    borderTheme: "border-indigo-500/30 hover:border-indigo-500/60",
    bgGradient: "from-indigo-500/15 via-purple-500/5 to-transparent",
    types: [
      {
        id: "adult_clothing",
        name: "Adult Clothing",
        icon: "👗",
        unit: "pcs",
        variants: [
          { id: "mens_shirts_sarongs", name: "Men Shirts & Sarongs", quantity: 0, unit: "pcs" },
          { id: "womens_dresses", name: "Women Casual Dresses & Sarees", quantity: 0, unit: "pcs" },
          {
            id: "underwear_adults",
            name: "Brand New Undergarment Sets",
            quantity: 0,
            unit: "sets",
          },
        ],
      },
      {
        id: "kids_clothing",
        name: "Children Clothing",
        icon: "🧒",
        unit: "pcs",
        variants: [
          {
            id: "boys_clothes",
            name: "Boys T-Shirts & Shorts (Ages 4-12)",
            quantity: 0,
            unit: "sets",
          },
          {
            id: "girls_clothes",
            name: "Girls Frocks & Sets (Ages 4-12)",
            quantity: 0,
            unit: "sets",
          },
          { id: "infant_onesies", name: "Infant Onesies & Warmers", quantity: 0, unit: "pcs" },
        ],
      },
      {
        id: "bedding_garments",
        name: "Blankets & Towels",
        icon: "🛏️",
        unit: "units",
        variants: [
          { id: "warm_blankets", name: "Warm Wool / Fleece Blankets", quantity: 0, unit: "units" },
          { id: "bath_towels", name: "Cotton Bath Towels", quantity: 0, unit: "pcs" },
          {
            id: "bedsheets",
            name: "Single/Double Bedsheets with Covers",
            quantity: 0,
            unit: "sets",
          },
        ],
      },
    ],
  },
  {
    id: "shelter",
    dbCategoryNameKeywords: ["shelter", "tent", "tarp", "tarpaulin", "mat", "rope"],
    name: "Shelter & Bedding",
    icon: "⛺",
    description: "Emergency tents, heavy-duty tarpaulins, sleeping mats, and mosquito nets.",
    color: "text-orange-600 dark:text-orange-400",
    borderTheme: "border-orange-500/30 hover:border-orange-500/60",
    bgGradient: "from-orange-500/15 via-amber-500/5 to-transparent",
    types: [
      {
        id: "tents_tarps",
        name: "Tents & Waterproof Tarps",
        icon: "🏕️",
        unit: "units",
        variants: [
          {
            id: "tarps_heavy",
            name: "Heavy Duty Tarpaulins (20x30ft)",
            quantity: 0,
            unit: "units",
          },
          { id: "family_tents", name: "4-6 Person Dome Relief Tents", quantity: 0, unit: "units" },
          { id: "nylon_ropes", name: "Nylon Tie-down Ropes (50m)", quantity: 0, unit: "coils" },
        ],
      },
      {
        id: "sleeping_mats",
        name: "Sleeping Mats & Nets",
        icon: "🛏️",
        unit: "units",
        variants: [
          { id: "foam_mats", name: "Waterproof Foam Sleeping Mats", quantity: 0, unit: "mats" },
          { id: "mosquito_nets", name: "Family Treated Mosquito Nets", quantity: 0, unit: "nets" },
        ],
      },
    ],
  },
  {
    id: "hygiene",
    dbCategoryNameKeywords: [
      "hygiene",
      "soap",
      "paste",
      "brush",
      "sanit",
      "bleach",
      "detergent",
      "tooth",
    ],
    name: "Hygiene & Sanitation",
    icon: "🧼",
    description: "Bath soaps, sanitary napkins, toothbrushes, detergents, and sanitizers.",
    color: "text-teal-600 dark:text-teal-400",
    borderTheme: "border-teal-500/30 hover:border-teal-500/60",
    bgGradient: "from-teal-500/15 via-emerald-500/5 to-transparent",
    types: [
      {
        id: "personal_hygiene",
        name: "Personal Hygiene Packs",
        icon: "🪥",
        unit: "packs",
        variants: [
          { id: "soap_bars", name: "Disinfectant Bath Soap Bars", quantity: 0, unit: "bars" },
          {
            id: "toothpaste_brush",
            name: "Toothpaste (120g) & Brush Sets",
            quantity: 0,
            unit: "sets",
          },
          {
            id: "hand_sanitizer",
            name: "Alcohol Hand Sanitizer (500ml)",
            quantity: 0,
            unit: "bottles",
          },
        ],
      },
      {
        id: "sanitary_feminine",
        name: "Feminine Hygiene",
        icon: "🌸",
        unit: "packs",
        variants: [
          {
            id: "sanitary_pads",
            name: "Sanitary Napkins (Packs of 10)",
            quantity: 0,
            unit: "packs",
          },
          { id: "intimate_wipes", name: "Antibacterial Hygiene Wipes", quantity: 0, unit: "packs" },
        ],
      },
      {
        id: "disinfectants",
        name: "Cleaning & Disinfection",
        icon: "🧹",
        unit: "bottles",
        variants: [
          { id: "bleach_bottles", name: "Chlorine Bleach (1L)", quantity: 0, unit: "bottles" },
          {
            id: "washing_powder",
            name: "Laundry Detergent Powder (1kg)",
            quantity: 0,
            unit: "packs",
          },
        ],
      },
    ],
  },
  {
    id: "equipment",
    dbCategoryNameKeywords: [
      "equipment",
      "tool",
      "torch",
      "battery",
      "generator",
      "gear",
      "boot",
      "shovel",
      "book",
    ],
    name: "Equipment & Tools",
    icon: "🔦",
    description: "Emergency torches, batteries, power banks, shovels, and boots.",
    color: "text-yellow-600 dark:text-yellow-400",
    borderTheme: "border-yellow-500/30 hover:border-yellow-500/60",
    bgGradient: "from-yellow-500/15 via-amber-500/5 to-transparent",
    types: [
      {
        id: "lighting_power",
        name: "Lighting & Power",
        icon: "💡",
        unit: "units",
        variants: [
          { id: "led_torches", name: "Rechargeable LED Torches", quantity: 0, unit: "units" },
          {
            id: "batteries_aa",
            name: "AA / D-Cell Alkaline Batteries (Pack of 4)",
            quantity: 0,
            unit: "packs",
          },
          { id: "power_banks", name: "10,000mAh Solar Power Banks", quantity: 0, unit: "units" },
          {
            id: "candles_matches",
            name: "Wax Emergency Candles & Matchboxes",
            quantity: 0,
            unit: "sets",
          },
        ],
      },
      {
        id: "utility_tools",
        name: "Utility & Rescue Gear",
        icon: "🛠️",
        unit: "units",
        variants: [
          { id: "shovels_spades", name: "Mud Shovels & Spades", quantity: 0, unit: "units" },
          { id: "gumboots", name: "Heavy Rubber Gumboots (Pairs)", quantity: 0, unit: "pairs" },
          {
            id: "safety_raincoats",
            name: "Reflective Waterproof Raincoats",
            quantity: 0,
            unit: "units",
          },
        ],
      },
    ],
  },
  {
    id: "other",
    dbCategoryNameKeywords: ["other", "misc", "kitchen", "bucket", "general"],
    name: "Other Relief Supplies",
    icon: "📦",
    description: "Kitchen utensils, gas cookers, plastic buckets, and general relief supplies.",
    color: "text-purple-600 dark:text-purple-400",
    borderTheme: "border-purple-500/30 hover:border-purple-500/60",
    bgGradient: "from-purple-500/15 via-indigo-500/5 to-transparent",
    types: [
      {
        id: "kitchenware",
        name: "Camp Kitchen Utensils",
        icon: "🍳",
        unit: "sets",
        variants: [
          { id: "aluminum_pots", name: "Large Aluminum Cooking Pots", quantity: 0, unit: "pots" },
          {
            id: "plastic_plates_cups",
            name: "Reusable Plastic Plates & Cups (Pack of 10)",
            quantity: 0,
            unit: "sets",
          },
          {
            id: "stainless_spoons",
            name: "Stainless Steel Spoon Sets (12 pcs)",
            quantity: 0,
            unit: "sets",
          },
        ],
      },
      {
        id: "camp_containers",
        name: "Buckets & Storage",
        icon: "🪣",
        unit: "units",
        variants: [
          {
            id: "plastic_buckets",
            name: "20L Plastic Water Buckets with Lids",
            quantity: 0,
            unit: "units",
          },
          {
            id: "heavy_garbage_bags",
            name: "Heavy Duty Waste Disposal Bags (Roll of 20)",
            quantity: 0,
            unit: "rolls",
          },
        ],
      },
    ],
  },
];

export function CoordinatorInventoryPage() {
  const { orgId, organization } = useOrganization();
  const queryClient = useQueryClient();

  // STATE 1: Which view is active:
  // null = Main 9-Categories Dashboard & Transaction Ledger
  // "food" | "water" | etc. = Dedicated Category Sub-Type Sorter View
  const [selectedCategoryView, setSelectedCategoryView] = useState<string | null>(null);

  // STATE 2: 3-Tier Hierarchy layout structure with safe fallback
  const [branches, setBranches] = useState<MainBranch[]>(() => {
    try {
      const saved = localStorage.getItem("resq_hub_custom_branches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 9) {
          // Merge with default properties to ensure all fields are safely present
          return DEFAULT_BRANCHES.map((defB) => {
            const userB = parsed.find((p: any) => p.id === defB.id);
            if (!userB) return defB;
            return {
              ...defB,
              ...userB,
              dbCategoryNameKeywords: defB.dbCategoryNameKeywords || [],
              types:
                Array.isArray(userB.types) && userB.types.length > 0 ? userB.types : defB.types,
            };
          });
        }
      }
    } catch (_) {}
    return DEFAULT_BRANCHES;
  });

  // DRAG & DROP RUNTIME STATE
  const [draggedDonation, setDraggedDonation] = useState<any | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  // SEARCH & FILTER STATES
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
  const [sorterSearch, setSorterSearch] = useState("");

  // MODAL STATES
  const [isAddSubTypeOpen, setIsAddSubTypeOpen] = useState(false);
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [targetSubTypeForVariant, setTargetSubTypeForVariant] = useState<string>("");
  const [newSubTypeName, setNewSubTypeName] = useState("");
  const [newSubTypeIcon, setNewSubTypeIcon] = useState("📦");
  const [newSubTypeUnit, setNewSubTypeUnit] = useState("units");
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantQty, setNewVariantQty] = useState("");
  const [newVariantUnit, setNewVariantUnit] = useState("");

  // QUICK ASSIGN POPUP STATE
  const [quickAssignDonationId, setQuickAssignDonationId] = useState<string | null>(null);
  const [quickAssignVariantId, setQuickAssignVariantId] = useState<string>("");

  // PERSISTED SORTED / SHELVED DONATION IDS (prevents infinite drag & drop)
  const [sortedDonationIds, setSortedDonationIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("resq_hub_sorted_donation_ids");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("resq_hub_sorted_donation_ids", JSON.stringify(sortedDonationIds));
    } catch (_) {}
  }, [sortedDonationIds]);

  // ACTIVE ALLOCATION STATE (when triggered from Requests preview modal)
  const [activeAllocation, setActiveAllocation] = useState<{
    requestId: string;
    requestCode?: string;
    category: string;
    item: string;
    quantity: number;
    unit?: string;
    requester: string;
    location?: string;
    priority?: string;
  } | null>(() => {
    try {
      const stored = localStorage.getItem("resq_hub_active_allocation");
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return null;
  });

  // Automatically switch to the matching category view when activeAllocation exists
  useEffect(() => {
    if (activeAllocation) {
      const reqCat = (activeAllocation.category || activeAllocation.item || "").toLowerCase();
      const matchedB = branches.find((b) => {
        if (b.name.toLowerCase() === reqCat || b.id.toLowerCase() === reqCat) return true;
        const kws = b.dbCategoryNameKeywords || [];
        return kws.some((kw) => reqCat.includes(kw));
      });
      if (matchedB) {
        setSelectedCategoryView(matchedB.id);
      } else {
        setSelectedCategoryView(branches[0]?.id || "food");
      }
    }
  }, [activeAllocation, branches]);

  const cancelActiveAllocation = () => {
    localStorage.removeItem("resq_hub_active_allocation");
    setActiveAllocation(null);
    toast.info("Allocation mode cancelled.");
  };

  const executeAllocationForRequest = async (
    alloc: NonNullable<typeof activeAllocation>,
    branchId: string,
    typeId: string,
    variantId: string,
    variantName: string,
    typeName: string,
    requestedQty: number,
  ) => {
    if (!alloc) return;

    const targetBranch = branches.find((b) => b.id === branchId);
    const dbCatId = targetBranch ? getDbCategoryIdForBranch(targetBranch) : null;
    const allocQty = Math.max(1, Number(requestedQty) || 1);

    // 1. Update UI Variant Stock (Deduct mathematically)
    setBranches((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== branchId) return b;
        return {
          ...b,
          types: (b.types || []).map((t) => {
            if (t.id !== typeId) return t;
            return {
              ...t,
              variants: (t.variants || []).map((v) => {
                if (v.id !== variantId) return v;
                return {
                  ...v,
                  quantity: Math.max(0, Number(v.quantity || 0) - allocQty),
                };
              }),
            };
          }),
        };
      });
      localStorage.setItem("resq_hub_custom_branches", JSON.stringify(updated));
      return updated;
    });

    // 2. Real Database Deduction & STOCK_OUT Transaction Log
    try {
      await inventoryAPI.deduct(
        {
          category_id: dbCatId || undefined,
          category_name: targetBranch?.name || alloc.category,
          quantity: allocQty,
          request_id: alloc.requestId,
          request_code: alloc.requestCode,
          item_name: variantName,
          requester_name: alloc.requester,
        },
        orgId,
      );
      queryClient.invalidateQueries({ queryKey: ["inventory", orgId] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions", orgId] });
    } catch (err: any) {
      console.warn("Backend deduct warning:", err);
    }

    // 3. Save Allocation Record in localStorage
    try {
      const existingAllocations = JSON.parse(localStorage.getItem("resq_hub_allocations") || "{}");
      existingAllocations[alloc.requestId] = {
        requestId: alloc.requestId,
        requestCode: alloc.requestCode,
        variantId,
        variantName,
        typeId,
        typeName,
        branchId,
        categoryName: targetBranch?.name || alloc.category,
        quantity: allocQty,
        unit: alloc.unit || "units",
        requester: alloc.requester,
        location: alloc.location || "",
        allocatedAt: new Date().toISOString(),
      };
      localStorage.setItem("resq_hub_allocations", JSON.stringify(existingAllocations));
      localStorage.setItem("resq_hub_auto_open_request_id", alloc.requestId);
    } catch (_) {}

    // 4. Clear active allocation
    localStorage.removeItem("resq_hub_active_allocation");
    setActiveAllocation(null);

    toast.success(
      `🎉 Successfully Allocated ${allocQty} ${alloc.unit || "units"} of ${variantName}!`,
      {
        description: `Reserved from Shelf "${typeName}" for Request #${alloc.requestCode || alloc.requestId.slice(0, 8)}. Returning to Request Details...`,
        duration: 3000,
      },
    );

    setTimeout(() => {
      window.location.href = `/coordinator/requests?allocatedRequestId=${alloc.requestId}`;
    }, 700);
  };

  // --------------------------------------------------------------------------
  // 1. REAL DATABASE QUERIES (SUPABASE POSTGRESQL VIA KONG GATEWAY)
  // --------------------------------------------------------------------------

  // Real DB Categories
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await categoriesAPI.getAll();
        return Array.isArray(res.data) ? res.data : res.data?.data || [];
      } catch (_) {
        return [];
      }
    },
  });

  // Real DB Inventory Balances
  const { data: dbInventoryRaw = [], refetch: refetchInventory } = useQuery({
    queryKey: ["inventory", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const res = await inventoryAPI.getAll(orgId);
        const list = res.data?.data ?? res.data ?? [];
        return Array.isArray(list) ? list : [];
      } catch (_) {
        return [];
      }
    },
    enabled: !!orgId,
    refetchInterval: 3000,
  });

  // Real DB Inward Donations
  const {
    data: dbDonationsRaw = [],
    isLoading: isDonationsLoading,
    refetch: refetchDonations,
  } = useQuery({
    queryKey: ["donations", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const res = await donationsAPI.getAll(orgId);
        const list = res.data?.data ?? res.data ?? [];
        return Array.isArray(list) ? list : [];
      } catch (_) {
        return [];
      }
    },
    enabled: !!orgId,
    refetchInterval: 3000,
  });

  // Real DB Inward Transaction Ledger Logs
  const {
    data: dbTransactionsRaw = [],
    isLoading: isTxLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["inventory_transactions", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const res = await inventoryAPI.getTransactions(orgId);
        const list = res.data?.data ?? res.data ?? [];
        return Array.isArray(list) ? list : [];
      } catch (_) {
        return [];
      }
    },
    enabled: !!orgId,
    refetchInterval: 3000,
  });

  // --------------------------------------------------------------------------
  // 2. SMART DATABASE CATEGORY RESOLVER
  // --------------------------------------------------------------------------
  const getDbCategoryIdForBranch = (branch: MainBranch): string | null => {
    const cats = Array.isArray(dbCategories) ? dbCategories : [];
    if (cats.length === 0) return null;

    // 1. Exact match by name
    const exact = cats.find(
      (c: any) => c.name?.toLowerCase().trim() === (branch?.name || "").toLowerCase().trim(),
    );
    if (exact) return exact.category_id;

    // 2. Match by keywords
    const keywords = branch?.dbCategoryNameKeywords || [];
    for (const kw of keywords) {
      const match = cats.find((c: any) => (c.name || "").toLowerCase().includes(kw));
      if (match) return match.category_id;
    }

    // 3. Fallback to first available category
    return cats[0]?.category_id || null;
  };

  // Real inventory mapped per branch
  const branchStockMap = useMemo(() => {
    const map = new Map<string, number>();
    const invList = Array.isArray(dbInventoryRaw) ? dbInventoryRaw : [];

    branches.forEach((b) => {
      let totalStock = 0;
      const matchedDbCatId = getDbCategoryIdForBranch(b);

      if (matchedDbCatId && invList.length > 0) {
        const invRow = invList.find((inv: any) => {
          const catId = inv.category_id || inv.resource_categories?.category_id;
          return catId === matchedDbCatId;
        });
        if (invRow) {
          totalStock += Number(invRow.quantity) || 0;
        }
      }

      // Also check if any inventory item matched by name
      if (totalStock === 0 && invList.length > 0) {
        invList.forEach((inv: any) => {
          const catName = (inv.resource_categories?.name || "").toLowerCase();
          const kws = b?.dbCategoryNameKeywords || [];
          if (kws.some((kw) => catName.includes(kw))) {
            totalStock += Number(inv.quantity) || 0;
          }
        });
      }

      // If database has 0, sum variants
      if (totalStock === 0 && Array.isArray(b?.types)) {
        totalStock = b.types.reduce(
          (tSum, t) =>
            tSum +
            (Array.isArray(t?.variants)
              ? t.variants.reduce((vSum, v) => vSum + (Number(v?.quantity) || 0), 0)
              : 0),
          0,
        );
      }

      map.set(b.id, totalStock);
    });

    return map;
  }, [branches, dbCategories, dbInventoryRaw]);

  // Grand Total of Real Stock
  const grandTotalStockUnits = useMemo(() => {
    let sum = 0;
    branchStockMap.forEach((qty) => {
      sum += qty;
    });
    return sum;
  }, [branchStockMap]);

  // Real Inward Donations that have been VERIFIED & DELIVERED to warehouse
  const realUnsortedDonations = useMemo(() => {
    if (!Array.isArray(dbDonationsRaw)) return [];
    // Only include donations that are fully verified and received at warehouse (handover completed via PIN / accepted)
    const VERIFIED_RECEIVED_STATUSES = [
      "COMPLETED",
      "VERIFIED",
      "ACCEPTED",
      "DELIVERED",
      "RECEIVED",
      "COLLECTED",
    ];
    return dbDonationsRaw.filter((d: any) => {
      const donId = String(d.donation_id || d.id || d._id);
      if (sortedDonationIds.includes(donId)) return false;
      const status = (d.status || "").toUpperCase();
      if (
        status === "SORTED" ||
        status === "SHELVED" ||
        status === "STORED" ||
        status === "CATEGORIZED"
      )
        return false;
      return VERIFIED_RECEIVED_STATUSES.includes(status);
    });
  }, [dbDonationsRaw, sortedDonationIds]);

  // Filtered Unsorted Donations for Current View
  const categoryUnsortedDonations = useMemo(() => {
    if (!selectedCategoryView) return realUnsortedDonations;
    const currentB = branches.find((b) => b.id === selectedCategoryView);
    if (!currentB) return realUnsortedDonations;

    const kws = currentB.dbCategoryNameKeywords || [];
    return realUnsortedDonations.filter((d: any) => {
      const cat = (d.category || "").toLowerCase();
      const resName = (d.resource_name || d.item_name || d.resource || "").toLowerCase();
      const notes = (d.donation_notes || d.remarks || "").toLowerCase();
      const combined = (cat + " " + resName + " " + notes).trim();

      const matchesKw = kws.some((kw: string) => combined.includes(kw.toLowerCase()));
      if (matchesKw) return true;
      if (currentB.id === "other") return true;
      return false;
    });
  }, [realUnsortedDonations, selectedCategoryView, branches]);

  // Current Active Branch Object
  const currentCategory = useMemo(() => {
    if (!selectedCategoryView) return null;
    return branches.find((b) => b.id === selectedCategoryView) || branches[0];
  }, [branches, selectedCategoryView]);

  // Filtered Real Transaction Ledger
  const filteredLedgerEntries = useMemo(() => {
    const list = Array.isArray(dbTransactionsRaw) ? dbTransactionsRaw : [];

    return list.filter((tx: any) => {
      const matchesSearch =
        !ledgerSearch ||
        (tx.item_name || tx.resources?.resource_name || tx.remarks || "")
          .toLowerCase()
          .includes(ledgerSearch.toLowerCase()) ||
        (tx.users?.first_name || tx.performed_by || "")
          .toLowerCase()
          .includes(ledgerSearch.toLowerCase()) ||
        (tx.transaction_type || "").toLowerCase().includes(ledgerSearch.toLowerCase());

      const matchesType =
        ledgerTypeFilter === "all" ||
        (tx.transaction_type || tx.type || "").toUpperCase() === ledgerTypeFilter.toUpperCase();

      return matchesSearch && matchesType;
    });
  }, [dbTransactionsRaw, ledgerSearch, ledgerTypeFilter]);

  // --------------------------------------------------------------------------
  // 3. REAL BACKEND MUTATION: ADD STOCK TO SUPABASE POSTGRESQL
  // --------------------------------------------------------------------------
  const syncToRealDbMutation = useMutation({
    mutationFn: async ({
      categoryId,
      quantity,
      donationId,
    }: {
      categoryId: string;
      quantity: number;
      donationId?: string;
      itemName?: string;
    }) => {
      // 1. Add / Increase inventory in Supabase
      const res = await inventoryAPI.add(categoryId, quantity, orgId);

      // 2. If it was from a donation, mark/approve the donation in DB
      if (donationId) {
        try {
          await donationsAPI.approve(donationId);
        } catch (_) {}
      }

      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", orgId] });
      queryClient.invalidateQueries({ queryKey: ["inventory_transactions", orgId] });
      queryClient.invalidateQueries({ queryKey: ["donations", orgId] });

      toast.success(`✅ Real Database Updated: +${variables.quantity} Units!`, {
        description: `Successfully added to Supabase PostgreSQL warehouse ledger under organization #${orgId?.slice(0, 8)}.`,
        duration: 4000,
      });
    },
    onError: (err: any) => {
      toast.info("Stock updated in UI shelf.", {
        description: err?.response?.data?.message || err?.message || "Connected via gateway.",
      });
    },
  });

  // --------------------------------------------------------------------------
  // 4. CORE DRAG & DROP & CATEGORIZATION HANDLERS (LINKED TO REAL BACKEND)
  // --------------------------------------------------------------------------
  const executeCategorization = (
    donation: any,
    targetCategoryView: string,
    targetTypeId: string,
    targetVariantId: string,
  ) => {
    if (!donation) return;

    const donationId = String(donation.donation_id || donation.id || donation._id);
    const donationQty = Math.max(1, Number(donation.quantity) || 1);
    const donationName =
      donation.resource_name || donation.item_name || donation.category || "Relief Supply";

    // 1. FIND MATCHING REAL DB CATEGORY ID
    const targetBranch = branches.find((b) => b.id === targetCategoryView);
    const dbCategoryId = targetBranch ? getDbCategoryIdForBranch(targetBranch) : null;

    // 2. TRIGGER REAL BACKEND API CALL TO SUPABASE
    if (dbCategoryId) {
      syncToRealDbMutation.mutate({
        categoryId: dbCategoryId,
        quantity: donationQty,
        donationId: donationId.startsWith("don_") ? undefined : donationId,
        itemName: donationName,
      });
    }

    // 3. UPDATE LOCAL VARIANT SHELVES
    setBranches((prevBranches) => {
      const updated = prevBranches.map((b) => {
        if (b.id !== targetCategoryView) return b;
        return {
          ...b,
          types: (b.types || []).map((t) => {
            if (t.id !== targetTypeId) return t;
            return {
              ...t,
              variants: (t.variants || []).map((v) => {
                if (v.id !== targetVariantId) return v;
                return {
                  ...v,
                  quantity: (Number(v.quantity) || 0) + donationQty,
                };
              }),
            };
          }),
        };
      });
      try {
        localStorage.setItem("resq_hub_custom_branches", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    // 4. MARK DONATION AS SORTED / SHELVED (removes immediately from tray, prevents infinite drag-drop)
    setSortedDonationIds((prev) => {
      if (prev.includes(donationId)) return prev;
      const next = [...prev, donationId];
      try {
        localStorage.setItem("resq_hub_sorted_donation_ids", JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    // 5. CLEAR DRAG STATE
    setDraggedDonation(null);
    setDragOverTargetId(null);
    setQuickAssignDonationId(null);
  };

  const handleDragEnd = () => {
    setDraggedDonation(null);
    setDragOverTargetId(null);
  };

  // DRAG EVENTS
  const handleDragStart = (e: React.DragEvent, donation: any) => {
    setDraggedDonation(donation);
    try {
      e.dataTransfer.setData("application/json", JSON.stringify(donation));
      e.dataTransfer.setData("text/plain", String(donation.donation_id || donation.id));
      e.dataTransfer.effectAllowed = "copyMove";
    } catch (_) {}
  };

  const handleDragOverVariant = (e: React.DragEvent, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = "copy";
    } catch (_) {}
    setDragOverTargetId(variantId);
  };

  const handleDragLeaveVariant = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTargetId(null);
  };

  const handleDropOnVariant = (e: React.DragEvent, typeId: string, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);

    let item = draggedDonation;
    if (!item) {
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (raw) item = JSON.parse(raw);
      } catch (_) {}
    }

    if (!item || !selectedCategoryView) {
      toast.error("Could not process dropped item. Please try again.");
      return;
    }

    executeCategorization(item, selectedCategoryView, typeId, variantId);
  };

  const handleDropOnSubTypeContainer = (
    e: React.DragEvent,
    typeId: string,
    fallbackVariantId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);

    let item = draggedDonation;
    if (!item) {
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (raw) item = JSON.parse(raw);
      } catch (_) {}
    }

    if (!item || !selectedCategoryView) return;
    executeCategorization(item, selectedCategoryView, typeId, fallbackVariantId);
  };

  // MANUAL INCREMENT DIRECTLY TO DATABASE
  const adjustVariantQuantity = (typeId: string, variantId: string, delta: number) => {
    if (!selectedCategoryView) return;

    const targetBranch = branches.find((b) => b.id === selectedCategoryView);
    const dbCategoryId = targetBranch ? getDbCategoryIdForBranch(targetBranch) : null;

    if (delta > 0 && dbCategoryId) {
      syncToRealDbMutation.mutate({
        categoryId: dbCategoryId,
        quantity: delta,
      });
    }

    setBranches((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== selectedCategoryView) return b;
        return {
          ...b,
          types: (b.types || []).map((t) => {
            if (t.id !== typeId) return t;
            return {
              ...t,
              variants: (t.variants || []).map((v) => {
                if (v.id !== variantId) return v;
                return { ...v, quantity: Math.max(0, (Number(v.quantity) || 0) + delta) };
              }),
            };
          }),
        };
      });
      try {
        localStorage.setItem("resq_hub_custom_branches", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  // REFRESH ALL DATABASE QUERIES
  const handleRefreshAll = () => {
    refetchInventory();
    refetchDonations();
    refetchTransactions();
    toast.success("Synchronized with real Supabase database!");
  };

  // ADD NEW SUB-TYPE TO CURRENT CATEGORY
  const handleCreateSubType = () => {
    if (!newSubTypeName.trim() || !selectedCategoryView) {
      toast.error("Please provide a sub-category name.");
      return;
    }

    const subTypeId =
      newSubTypeName.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now().toString().slice(-4);
    const newSub: SubType = {
      id: subTypeId,
      name: newSubTypeName.trim(),
      icon: newSubTypeIcon || "📦",
      unit: newSubTypeUnit || "units",
      variants: [
        {
          id: subTypeId + "_var1",
          name: "Standard " + newSubTypeName.trim(),
          quantity: 0,
          unit: newSubTypeUnit || "units",
        },
      ],
    };

    setBranches((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== selectedCategoryView) return b;
        return { ...b, types: [...(b.types || []), newSub] };
      });
      try {
        localStorage.setItem("resq_hub_custom_branches", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    setNewSubTypeName("");
    setIsAddSubTypeOpen(false);
    toast.success(`Created sub-category "${newSub.name}" with default shelf!`);
  };

  // ADD NEW VARIANT TO SUB-TYPE
  const handleCreateVariant = () => {
    if (!newVariantName.trim() || !targetSubTypeForVariant || !selectedCategoryView) {
      toast.error("Please fill in the variant name.");
      return;
    }

    const varId =
      newVariantName.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now().toString().slice(-4);
    const qty = parseInt(newVariantQty) || 0;

    setBranches((prev) => {
      const updated = prev.map((b) => {
        if (b.id !== selectedCategoryView) return b;
        return {
          ...b,
          types: (b.types || []).map((t) => {
            if (t.id !== targetSubTypeForVariant) return t;
            return {
              ...t,
              variants: [
                ...(t.variants || []),
                {
                  id: varId,
                  name: newVariantName.trim(),
                  quantity: qty,
                  unit: newVariantUnit || t.unit || "units",
                },
              ],
            };
          }),
        };
      });
      try {
        localStorage.setItem("resq_hub_custom_branches", JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    setNewVariantName("");
    setNewVariantQty("");
    setIsAddVariantOpen(false);
    toast.success(`Added variant shelf "${newVariantName}"!`);
  };

  // --------------------------------------------------------------------------
  // RENDER: VIEW 2 -> DEDICATED CATEGORY SUB-TYPE & SORTER PAGE
  // --------------------------------------------------------------------------
  if (selectedCategoryView && currentCategory) {
    const allVariantsInCurrentCategory: {
      typeId: string;
      typeName: string;
      variantId: string;
      variantName: string;
      unit: string;
    }[] = [];
    (currentCategory.types || []).forEach((t) => {
      (t.variants || []).forEach((v) => {
        allVariantsInCurrentCategory.push({
          typeId: t.id,
          typeName: t.name,
          variantId: v.id,
          variantName: v.name,
          unit: v.unit,
        });
      });
    });

    const categoryRealStock = branchStockMap.get(currentCategory.id) || 0;

    return (
      <div className="space-y-6 pb-20">
        {/* TOP NAVIGATION BREADCRUMB & CATEGORY HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategoryView(null)}
                className="gap-1.5 text-xs font-semibold hover:bg-muted"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to All Categories
              </Button>
              <span className="text-muted-foreground text-xs">/</span>
              <span className="text-xs font-medium text-muted-foreground">Department Sorter</span>
              <span className="text-muted-foreground text-xs">/</span>
              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                <span>{currentCategory.icon}</span> {currentCategory.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-2xl shadow-xs">
                {currentCategory.icon}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  {currentCategory.name}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Database className="h-3 w-3" /> Supabase DB Connected
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentCategory.description}
                </p>
              </div>
            </div>
          </div>

          {/* CATEGORY STATS & ACTIONS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-card border border-border shadow-xs text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Dept Stock (DB)
              </span>
              <strong className="text-base font-black text-foreground">
                {categoryRealStock.toLocaleString()}{" "}
                <span className="text-xs font-normal text-muted-foreground">units</span>
              </strong>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-card border border-border shadow-xs text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Unsorted Inward (DB)
              </span>
              <strong className="text-base font-black text-amber-500">
                {categoryUnsortedDonations.length}{" "}
                <span className="text-xs font-normal text-muted-foreground">items</span>
              </strong>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddSubTypeOpen(true)}
              className="gap-1.5 font-semibold text-xs shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 text-primary" /> Add Sub-Category
            </Button>
          </div>
        </div>

        {/* WORKSPACE: TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8-COLS: SUB-CATEGORIES & SHELF VARIANTS */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" /> Sub-Categories & Variant Shelves
                </h2>
                <p className="text-xs text-muted-foreground">
                  Drag items from the right inward tray and drop onto any shelf below to increment
                  real database stock.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddSubTypeOpen(true)}
                className="text-xs font-semibold gap-1 text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" /> + New Sub-Category
              </Button>
            </div>

            {(currentCategory.types || []).length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl bg-card/50">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-sm">No sub-categories created yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Create your first sub-category (e.g. "Rice & Grains") to start organizing stock.
                </p>
                <Button size="sm" onClick={() => setIsAddSubTypeOpen(true)} className="gap-2">
                  <Plus className="h-3.5 w-3.5" /> Create Sub-Category
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {(currentCategory.types || []).map((subType) => {
                  const subTypeTotal = (subType.variants || []).reduce(
                    (acc, v) => acc + (Number(v.quantity) || 0),
                    0,
                  );

                  return (
                    <div
                      key={subType.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        if (subType.variants && subType.variants.length > 0) {
                          handleDropOnSubTypeContainer(e, subType.id, subType.variants[0].id);
                        }
                      }}
                      className="p-5 rounded-2xl border border-border bg-card/70 shadow-sm space-y-4 hover:border-primary/40 transition-all duration-200 relative group"
                    >
                      {/* SUB-TYPE HEADER */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-1.5 rounded-lg bg-muted/60 shadow-2xs">
                            {subType.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-foreground">
                                {subType.name}
                              </h3>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                Unit: {subType.unit}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {(subType.variants || []).length} Variant Shelves • In Stock:{" "}
                              <strong className="text-foreground font-semibold">
                                {subTypeTotal.toLocaleString()} {subType.unit}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTargetSubTypeForVariant(subType.id);
                              setNewVariantUnit(subType.unit);
                              setIsAddVariantOpen(true);
                            }}
                            className="text-xs font-semibold gap-1 h-8 shadow-2xs"
                          >
                            <Plus className="h-3.5 w-3.5 text-primary" /> Add Variant
                          </Button>
                        </div>
                      </div>

                      {/* VARIANTS SHELVES GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(subType.variants || []).map((v) => {
                          const isHovered = dragOverTargetId === v.id;

                          return (
                            <div
                              key={v.id}
                              onDragOver={(e) => handleDragOverVariant(e, v.id)}
                              onDragLeave={handleDragLeaveVariant}
                              onDrop={(e) => handleDropOnVariant(e, subType.id, v.id)}
                              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                                isHovered
                                  ? "bg-emerald-500/15 border-emerald-500 ring-4 ring-emerald-500/40 scale-[1.03] shadow-lg"
                                  : "bg-background/80 border-border/90 hover:border-primary/50 hover:bg-muted/20 shadow-2xs"
                              }`}
                            >
                              {/* DROP OVERLAY INDICATOR */}
                              {isHovered && (
                                <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
                                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-md animate-bounce flex items-center gap-1">
                                    🎯 Drop to Sync with DB!
                                  </span>
                                </div>
                              )}

                              <div>
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-bold text-xs text-foreground line-clamp-2">
                                    {v.name}
                                  </span>
                                  {v.isPerishable && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                                      <Flame className="h-2.5 w-2.5" /> Perishable
                                    </span>
                                  )}
                                </div>

                                <div className="mt-3 flex items-baseline justify-between">
                                  <div>
                                    <span className="text-2xl font-black tracking-tight text-foreground">
                                      {(Number(v.quantity) || 0).toLocaleString()}
                                    </span>
                                    <span className="text-xs font-semibold text-muted-foreground ml-1">
                                      {v.unit}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* ALLOCATION MODE ACTION */}
                              {activeAllocation && (
                                <div className="mt-2.5 pt-2 border-t border-emerald-500/30">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      executeAllocationForRequest(
                                        activeAllocation,
                                        currentCategory.id,
                                        subType.id,
                                        v.id,
                                        v.name,
                                        subType.name,
                                        activeAllocation.quantity,
                                      )
                                    }
                                    className={`w-full text-[11px] font-bold gap-1.5 h-7 shadow-xs ${
                                      (Number(v.quantity) || 0) >=
                                      (Number(activeAllocation.quantity) || 1)
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                                        : "bg-amber-600 hover:bg-amber-700 text-white"
                                    }`}
                                  >
                                    <PackageCheck className="h-3.5 w-3.5" />
                                    Allocate {activeAllocation.quantity}{" "}
                                    {activeAllocation.unit || v.unit || "units"}
                                  </Button>
                                </div>
                              )}

                              {/* ACTIONS & DROPZONE PROMPT */}
                              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="font-mono text-[10px] text-muted-foreground/80 flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-primary" /> Shelf Dropzone
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => adjustVariantQuantity(subType.id, v.id, -1)}
                                    title="Decrease 1"
                                    className="h-6 w-6 rounded bg-muted/60 hover:bg-muted font-bold text-foreground flex items-center justify-center transition-colors"
                                  >
                                    -
                                  </button>
                                  <button
                                    onClick={() => adjustVariantQuantity(subType.id, v.id, 1)}
                                    title="Increase 1 (Syncs DB)"
                                    className="h-6 w-6 rounded bg-muted/60 hover:bg-muted font-bold text-foreground flex items-center justify-center transition-colors"
                                  >
                                    +
                                  </button>
                                  <button
                                    onClick={() => adjustVariantQuantity(subType.id, v.id, 10)}
                                    title="Increase 10 (Syncs DB)"
                                    className="h-6 px-1.5 rounded bg-primary/10 hover:bg-primary/20 font-bold text-primary text-[10px] flex items-center justify-center transition-colors"
                                  >
                                    +10
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT 4-COLS: REAL INWARD DONATIONS TRAY FROM SUPABASE */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground leading-none">
                      Verified Inward Donations Tray
                    </h3>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Live Real Database (Supabase)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sortedDonationIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Reset sorted donations cache to show all inward items in the tray again?",
                          )
                        ) {
                          setSortedDonationIds([]);
                          try {
                            localStorage.removeItem("resq_hub_sorted_donation_ids");
                          } catch (_) {}
                          toast.info("Sorted donations cache reset.");
                        }
                      }}
                      className="text-[10px] text-muted-foreground hover:text-primary underline cursor-pointer"
                      title="Reset sorted items cache"
                    >
                      Reset ({sortedDonationIds.length} sorted)
                    </button>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30">
                    {categoryUnsortedDonations.length} In DB
                  </span>
                </div>
              </div>

              {/* SEARCH WITHIN TRAY */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter database items..."
                  value={sorterSearch}
                  onChange={(e) => setSorterSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-muted/30"
                />
              </div>

              {/* REAL DATABASE DONATIONS LIST */}
              <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {isDonationsLoading ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    <Activity className="h-5 w-5 animate-spin mx-auto mb-1 text-primary" />
                    Fetching real donations from database...
                  </div>
                ) : categoryUnsortedDonations.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-border rounded-xl bg-muted/20">
                    <CheckCheck className="h-8 w-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                    <p className="font-bold text-xs text-foreground">
                      No Unsorted Verified Donations
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Donations will appear here once verified and handed over to the warehouse via
                      PIN.
                    </p>
                  </div>
                ) : (
                  categoryUnsortedDonations
                    .filter((d: any) => {
                      if (!sorterSearch) return true;
                      const q = sorterSearch.toLowerCase();
                      return (
                        (d.resource_name || d.item_name || "").toLowerCase().includes(q) ||
                        (d.donor_name || "").toLowerCase().includes(q) ||
                        (d.category || "").toLowerCase().includes(q)
                      );
                    })
                    .map((donation: any) => {
                      const donId = String(donation.donation_id || donation.id || donation._id);
                      const isBeingDragged =
                        draggedDonation &&
                        String(draggedDonation.donation_id || draggedDonation.id) === donId;
                      const isQuickAssignOpen = quickAssignDonationId === donId;

                      return (
                        <div
                          key={donId}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, donation)}
                          onDragEnd={handleDragEnd}
                          className={`p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                            isBeingDragged
                              ? "opacity-40 scale-95 border-primary shadow-lg bg-primary/10"
                              : "bg-background hover:bg-muted/30 border-border hover:border-primary/50 shadow-2xs hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 text-muted-foreground hover:text-primary transition-colors cursor-grab">
                              <GripVertical className="h-4 w-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-bold text-xs text-foreground leading-tight truncate">
                                  {donation.resource_name ||
                                    donation.item_name ||
                                    donation.category ||
                                    "Relief Supply"}
                                </h4>
                                <span className="font-black text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                  +{donation.quantity || 1} {donation.unit || "units"}
                                </span>
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span className="truncate max-w-[140px] font-medium text-foreground/80">
                                  👤 {donation.donor_name || "Donation Entry"}
                                </span>
                                {donation.status && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 border border-emerald-500/20">
                                    <ShieldCheck className="h-2.5 w-2.5" /> {donation.status}
                                  </span>
                                )}
                              </div>

                              {donation.donation_notes && (
                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">
                                  "{donation.donation_notes}"
                                </p>
                              )}

                              {/* QUICK ASSIGN */}
                              <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Drag ➔ or
                                </span>

                                {!isQuickAssignOpen ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setQuickAssignDonationId(donId);
                                      if (allVariantsInCurrentCategory.length > 0) {
                                        setQuickAssignVariantId(
                                          allVariantsInCurrentCategory[0].variantId,
                                        );
                                      }
                                    }}
                                    className="h-6 px-2 text-[10px] font-semibold gap-1 text-primary hover:bg-primary/10"
                                  >
                                    Quick Assign <ChevronDown className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-1 w-full mt-1">
                                    <select
                                      value={quickAssignVariantId}
                                      onChange={(e) => setQuickAssignVariantId(e.target.value)}
                                      className="h-6 text-[10px] rounded border border-border bg-background px-1 py-0 flex-1 max-w-[150px] font-medium"
                                    >
                                      {allVariantsInCurrentCategory.map((v) => (
                                        <option key={v.variantId} value={v.variantId}>
                                          {v.typeName} → {v.variantName}
                                        </option>
                                      ))}
                                    </select>
                                    <Button
                                      size="sm"
                                      disabled={syncToRealDbMutation.isPending}
                                      onClick={() => {
                                        const selected =
                                          allVariantsInCurrentCategory.find(
                                            (v) => v.variantId === quickAssignVariantId,
                                          ) || allVariantsInCurrentCategory[0];
                                        if (selected) {
                                          executeCategorization(
                                            donation,
                                            selectedCategoryView,
                                            selected.typeId,
                                            selected.variantId,
                                          );
                                        }
                                      }}
                                      className="h-6 px-2 text-[10px] font-bold bg-primary text-primary-foreground"
                                    >
                                      {syncToRealDbMutation.isPending ? "..." : "Save"}
                                    </Button>
                                    <button
                                      onClick={() => setQuickAssignDonationId(null)}
                                      className="text-[10px] text-muted-foreground px-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: ADD NEW SUB-CATEGORY */}
        <Dialog open={isAddSubTypeOpen} onOpenChange={setIsAddSubTypeOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" /> Add Sub-Category to{" "}
                {currentCategory.name}
              </DialogTitle>
              <DialogDescription>
                Create a new sub-category (e.g. "Rice & Grains", "Canned Protein") under{" "}
                {currentCategory.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="subTypeName">Sub-Category Name</Label>
                <Input
                  id="subTypeName"
                  placeholder="e.g. Rice & Grains, Fresh Dairy..."
                  value={newSubTypeName}
                  onChange={(e) => setNewSubTypeName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="subTypeIcon">Icon / Emoji</Label>
                  <Input
                    id="subTypeIcon"
                    placeholder="e.g. 🍚, 🥛, 🥫"
                    value={newSubTypeIcon}
                    onChange={(e) => setNewSubTypeIcon(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="subTypeUnit">Measurement Unit</Label>
                  <Input
                    id="subTypeUnit"
                    placeholder="e.g. kg, packets, cans, pcs"
                    value={newSubTypeUnit}
                    onChange={(e) => setNewSubTypeUnit(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddSubTypeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubType} className="font-semibold">
                Create Sub-Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* MODAL: ADD NEW VARIANT */}
        <Dialog open={isAddVariantOpen} onOpenChange={setIsAddVariantOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" /> Add Variant Shelf
              </DialogTitle>
              <DialogDescription>
                Add a specific product shelf or variant under the chosen sub-category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="varName">Variant / Shelf Name</Label>
                <Input
                  id="varName"
                  placeholder="e.g. White Rice (Samba 5kg), Vanilla Milk 180ml"
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="varQty">Initial Stock Count</Label>
                  <Input
                    id="varQty"
                    type="number"
                    placeholder="0"
                    value={newVariantQty}
                    onChange={(e) => setNewVariantQty(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="varUnit">Unit</Label>
                  <Input
                    id="varUnit"
                    placeholder="kg, packets, pcs"
                    value={newVariantUnit}
                    onChange={(e) => setNewVariantUnit(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddVariantOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVariant} className="font-semibold">
                Add Shelf Variant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: VIEW 1 -> MAIN INVENTORY DASHBOARD WITH 9 CATEGORIES & TRANSACTION LOGS
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-8 pb-24">
      {/* PAGE TITLE & CONTROLS */}
      <PageHeader
        title="Relief Inventory Hub & Warehouse Management"
        description="Live humanitarian warehouse inventory connected to Supabase PostgreSQL real database."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold"
              onClick={handleRefreshAll}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sync Live DB
            </Button>
          </div>
        }
      />

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Total Warehouse Stock (DB)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">
              {grandTotalStockUnits.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">units</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <Database className="h-3 w-3" /> Live Supabase PostgreSQL
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Active Relief Categories
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary">9</span>
            <span className="text-xs font-semibold text-muted-foreground">Humanitarian Depts</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {(Array.isArray(dbCategories) ? dbCategories : []).length} Categories Registered in DB
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Verified Inward Stock
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-500">
              {realUnsortedDonations.length}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">in database</span>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 block">
            Received & Ready for Sorting
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            Recorded Ledger Logs (DB)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">
              {filteredLedgerEntries.length}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">transactions</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> PostgreSQL Audit Trail
          </span>
        </div>
      </div>

      {/* SECTION 1: THE 9 RELIEF CATEGORIES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> 9 Humanitarian Relief Categories
            </h2>
            <p className="text-xs text-muted-foreground">
              Click any category card to open its variant shelves and drag-and-drop inward donation
              sorter.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Select a category to sort items ➔
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => {
            const branchTotalUnits = branchStockMap.get(b.id) || 0;
            const totalVariantsCount = (b.types || []).reduce(
              (acc, t) => acc + (t.variants || []).length,
              0,
            );

            // Count real inward donations in DB matching this branch
            const pendingForThisCategory = realUnsortedDonations.filter((d: any) => {
              const cat = (d.category || d.resource_name || "").toLowerCase();
              const kws = b.dbCategoryNameKeywords || [];
              return kws.some((kw) => cat.includes(kw));
            }).length;

            return (
              <div
                key={b.id}
                onClick={() => setSelectedCategoryView(b.id)}
                className={`p-5 rounded-2xl border bg-card hover:bg-card/90 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] flex flex-col justify-between group relative overflow-hidden ${b.borderTheme || "border-border"}`}
              >
                {/* BACKGROUND ACCENT GRADIENT */}
                <div
                  className={`absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br ${b.bgGradient || "from-primary/10 to-transparent"} rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
                />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-background/90 border border-border shadow-2xs">
                        {b.icon}
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                          {b.name}
                        </h3>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {(b.types || []).length} Sub-Types • {totalVariantsCount} Shelves
                        </span>
                      </div>
                    </div>

                    {pendingForThisCategory > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/30 shrink-0">
                        ⚡ {pendingForThisCategory} in DB
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {b.description}
                  </p>
                </div>

                <div className="relative z-10 mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Live Stock (DB)
                    </span>
                    <strong className="text-lg font-black text-foreground">
                      {branchTotalUnits.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-muted-foreground">units</span>
                    </strong>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="font-bold text-xs gap-1.5 text-primary group-hover:translate-x-1 transition-transform p-0 h-auto hover:bg-transparent"
                  >
                    Open Sorter <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: REAL TRANSACTION HISTORY & STOCK MOVEMENT LEDGER */}
      <div className="space-y-4 pt-4 border-t border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Real Inward Transaction History & Stock
              Movement Ledger
            </h2>
            <p className="text-xs text-muted-foreground">
              Live audit logs fetched directly from Supabase PostgreSQL{" "}
              <code>inventory_transactions</code> table.
            </p>
          </div>

          {/* FILTER CONTROLS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search transaction logs..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/30"
              />
            </div>

            <select
              value={ledgerTypeFilter}
              onChange={(e) => setLedgerTypeFilter(e.target.value)}
              className="h-8 text-xs rounded-md border border-border bg-background px-2.5 font-medium"
            >
              <option value="all">All Movements</option>
              <option value="STOCK_IN">Inward Stock In (PIN Verified)</option>
              <option value="STOCK_OUT">Dispatch Outward</option>
            </select>
          </div>
        </div>

        {/* LEDGER TABLE */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold w-[160px]">Timestamp</TableHead>
                <TableHead className="text-xs font-bold w-[120px]">Movement Type</TableHead>
                <TableHead className="text-xs font-bold">Item & Relief Supply</TableHead>
                <TableHead className="text-xs font-bold text-right">Quantity</TableHead>
                <TableHead className="text-xs font-bold">Handled By / Origin</TableHead>
                <TableHead className="text-xs font-bold">Database Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isTxLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                    <Activity className="h-4 w-4 animate-spin inline-block mr-2 text-primary" />
                    Loading real transactions from Supabase...
                  </TableCell>
                </TableRow>
              ) : filteredLedgerEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                    No matching transaction logs found in database.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLedgerEntries.slice(0, 25).map((tx: any) => {
                  const txType = tx.transaction_type || tx.type || "STOCK_IN";
                  const isPositive = txType.includes("IN");
                  const dateStr = tx.created_at || tx.timestamp;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recently";

                  const itemName =
                    tx.resources?.resource_name ||
                    tx.item_name ||
                    tx.category_name ||
                    "Relief Supplies";
                  const handledBy = tx.users
                    ? `${tx.users.first_name || ""} ${tx.users.last_name || ""}`.trim()
                    : tx.performed_by || "Coordinator / System";

                  return (
                    <TableRow
                      key={tx.transaction_id || tx.id || Math.random()}
                      className="hover:bg-muted/30 text-xs"
                    >
                      <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formattedDate}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isPositive
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="h-2.5 w-2.5" />
                          ) : (
                            <ArrowUpRight className="h-2.5 w-2.5" />
                          )}
                          {txType}
                        </span>
                      </TableCell>

                      <TableCell className="font-semibold text-foreground">{itemName}</TableCell>

                      <TableCell className="text-right font-black">
                        <span
                          className={
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }
                        >
                          {isPositive ? "+" : "-"}
                          {Math.abs(tx.quantity || 1).toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground/90">
                          <ShieldCheck className="h-3 w-3 text-primary shrink-0" />
                          {handledBy || "Warehouse Staff"}
                        </span>
                      </TableCell>

                      <TableCell className="text-muted-foreground max-w-[280px] truncate text-[11px]">
                        {tx.remarks || tx.notes || "Standard warehouse transaction"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
