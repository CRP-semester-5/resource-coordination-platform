import type {
  AppNotification,
  AuditEntry,
  Donation,
  HelpRequest,
  InventoryItem,
  Organization,
  PlatformUser,
  ResourceCategory,
  Task,
  Volunteer,
} from "./types";

const day = 86_400_000;
const now = Date.UTC(2026, 7, 5, 9, 0, 0);
const at = (offsetDays: number) => new Date(now + offsetDays * day).toISOString();

export const organizations: Organization[] = [
  {
    id: "org-1",
    name: "Kelani Valley Relief Network",
    registrationNumber: "NGO/2019/00421",
    category: "Community NGO",
    district: "Colombo",
    contactEmail: "coordinate@kvrelief.lk",
    contactPhone: "+94 11 234 5566",
    description: "Flood response network operating along the Kelani river basin.",
    verification: "Approved",
    members: 48,
    createdAt: at(-620),
  },
  {
    id: "org-2",
    name: "Ratnapura Landslide Response Unit",
    registrationNumber: "NGO/2021/01188",
    category: "Disaster Response",
    district: "Ratnapura",
    contactEmail: "ops@rlru.lk",
    contactPhone: "+94 45 221 7788",
    description: "Landslide early response and shelter coordination unit.",
    verification: "Approved",
    members: 31,
    createdAt: at(-410),
  },
  {
    id: "org-3",
    name: "Galle Coastal Aid Foundation",
    registrationNumber: "NGO/2018/00097",
    category: "Faith Based",
    district: "Galle",
    contactEmail: "hello@gcaf.lk",
    contactPhone: "+94 91 445 2210",
    description: "Coastal community resilience and relief distribution.",
    verification: "Approved",
    members: 22,
    createdAt: at(-880),
  },
  {
    id: "org-4",
    name: "Badulla Highland Volunteers",
    registrationNumber: "NGO/2026/02310",
    category: "Volunteer Group",
    district: "Badulla",
    contactEmail: "info@bhv.lk",
    contactPhone: "+94 55 332 1140",
    description: "Newly formed highland volunteer collective awaiting verification.",
    verification: "Pending",
    members: 9,
    createdAt: at(-12),
  },
  {
    id: "org-5",
    name: "Matara Rapid Support Trust",
    registrationNumber: "NGO/2026/02377",
    category: "Charitable Trust",
    district: "Matara",
    contactEmail: "trust@mrst.lk",
    contactPhone: "+94 41 220 9931",
    description: "Trust registration submitted with incomplete documentation.",
    verification: "Rejected",
    members: 4,
    createdAt: at(-30),
  },
];

/** Organizations the signed-in coordinator belongs to. */
export const coordinatorOrgIds = ["org-1", "org-2", "org-3"];

export const resourceCategories: ResourceCategory[] = [
  { id: "cat-1", name: "Food", description: "Dry rations and cooked meal packs", unit: "packs", priority: "Critical" },
  { id: "cat-2", name: "Drinking Water", description: "Bottled and bowser water", unit: "litres", priority: "Critical" },
  { id: "cat-3", name: "Medical Supplies", description: "First aid and essential medicine", unit: "kits", priority: "High" },
  { id: "cat-4", name: "Clothing", description: "Dry clothing and blankets", unit: "bundles", priority: "Medium" },
  { id: "cat-5", name: "Shelter Equipment", description: "Tents, tarpaulins and rope", unit: "units", priority: "High" },
  { id: "cat-6", name: "Hygiene Kits", description: "Soap, sanitary and cleaning items", unit: "kits", priority: "Medium" },
];

export const requests: HelpRequest[] = [
  {
    id: "req-1", code: "REQ-2451", orgId: "org-1", requester: "Nimali Perera", requesterPhone: "+94 77 123 4567",
    category: "Drinking Water", resourceType: "Bottled water 1L", quantity: 600, unit: "litres", priority: "Critical",
    location: "Kolonnawa, Colombo", requiredDate: at(1), createdAt: at(-1), status: "Pending",
    description: "Wells contaminated after river overflow. 120 families without safe water.",
    timeline: [{ status: "Pending", at: at(-1), note: "Request submitted" }],
  },
  {
    id: "req-2", code: "REQ-2452", orgId: "org-1", requester: "Sunil Bandara", requesterPhone: "+94 71 998 2211",
    category: "Food", resourceType: "Dry ration pack", quantity: 180, unit: "packs", priority: "High",
    location: "Wellampitiya, Colombo", requiredDate: at(2), createdAt: at(-2), status: "Pending",
    description: "Community kitchen supplies exhausted for the relief camp at the temple grounds.",
    timeline: [{ status: "Pending", at: at(-2), note: "Request submitted" }],
  },
  {
    id: "req-3", code: "REQ-2453", orgId: "org-1", requester: "Fathima Rizwan", requesterPhone: "+94 76 441 0092",
    category: "Medical Supplies", resourceType: "First aid kit", quantity: 40, unit: "kits", priority: "High",
    location: "Angoda, Colombo", requiredDate: at(0), createdAt: at(-4), status: "Approved",
    description: "Minor injuries reported during evacuation, clinic stock depleted.",
    timeline: [
      { status: "Pending", at: at(-4), note: "Request submitted" },
      { status: "Under Review", at: at(-3), note: "Coordinator verifying details" },
      { status: "Approved", at: at(-3), note: "Approved by D. Weerasinghe" },
    ],
  },
  {
    id: "req-4", code: "REQ-2454", orgId: "org-1", requester: "Chaminda Silva", requesterPhone: "+94 70 220 8877",
    category: "Shelter Equipment", resourceType: "Tarpaulin sheet", quantity: 75, unit: "units", priority: "Medium",
    location: "Mulleriyawa, Colombo", requiredDate: at(3), createdAt: at(-6), status: "Partially Fulfilled",
    description: "Temporary roofing needed for 75 damaged homes.",
    timeline: [
      { status: "Pending", at: at(-6) },
      { status: "Approved", at: at(-5), note: "Approved with partial stock" },
      { status: "Partially Fulfilled", at: at(-2), note: "45 of 75 units delivered" },
    ],
  },
  {
    id: "req-5", code: "REQ-2455", orgId: "org-1", requester: "Ayesha Jayawardena", requesterPhone: "+94 77 662 3311",
    category: "Hygiene Kits", resourceType: "Family hygiene kit", quantity: 120, unit: "kits", priority: "Medium",
    location: "Kotikawatta, Colombo", requiredDate: at(-1), createdAt: at(-9), status: "Fulfilled",
    description: "Sanitation supplies for the community centre shelter.",
    timeline: [
      { status: "Pending", at: at(-9) },
      { status: "Approved", at: at(-8) },
      { status: "Fulfilled", at: at(-5), note: "Full quantity delivered" },
    ],
  },
  {
    id: "req-6", code: "REQ-2456", orgId: "org-1", requester: "Ranjith Kumara", requesterPhone: "+94 71 003 4412",
    category: "Food", resourceType: "Cooked meal pack", quantity: 300, unit: "packs", priority: "Low",
    location: "Nawagamuwa, Colombo", requiredDate: at(6), createdAt: at(-11), status: "Rejected",
    rejectionReason: "Duplicate of REQ-2452 submitted by the same relief camp.",
    description: "Meals for evacuees at the school shelter.",
    timeline: [
      { status: "Pending", at: at(-11) },
      { status: "Rejected", at: at(-10), note: "Duplicate request" },
    ],
  },
  {
    id: "req-7", code: "REQ-2457", orgId: "org-2", requester: "Tharindu Alwis", requesterPhone: "+94 78 552 1900",
    category: "Shelter Equipment", resourceType: "Family tent", quantity: 30, unit: "units", priority: "Critical",
    location: "Eheliyagoda, Ratnapura", requiredDate: at(1), createdAt: at(-1), status: "Pending",
    description: "Landslide destroyed 30 homes on the slope above the village.",
    timeline: [{ status: "Pending", at: at(-1) }],
  },
  {
    id: "req-8", code: "REQ-2458", orgId: "org-2", requester: "Kumari Dissanayake", requesterPhone: "+94 76 118 7743",
    category: "Medical Supplies", resourceType: "Chronic medicine pack", quantity: 55, unit: "kits", priority: "High",
    location: "Kuruwita, Ratnapura", requiredDate: at(2), createdAt: at(-3), status: "Under Review",
    description: "Elderly evacuees need diabetes and blood pressure medication.",
    timeline: [
      { status: "Pending", at: at(-3) },
      { status: "Under Review", at: at(-2), note: "Awaiting medical officer confirmation" },
    ],
  },
  {
    id: "req-9", code: "REQ-2459", orgId: "org-2", requester: "Lasantha Fernando", requesterPhone: "+94 77 909 8123",
    category: "Drinking Water", resourceType: "Water bowser run", quantity: 8000, unit: "litres", priority: "High",
    location: "Pelmadulla, Ratnapura", requiredDate: at(0), createdAt: at(-5), status: "Approved",
    description: "Pipeline damaged, three villages cut off from the supply line.",
    timeline: [
      { status: "Pending", at: at(-5) },
      { status: "Approved", at: at(-4), note: "Bowser scheduled" },
    ],
  },
  {
    id: "req-10", code: "REQ-2460", orgId: "org-2", requester: "Menaka Herath", requesterPhone: "+94 70 771 6650",
    category: "Clothing", resourceType: "Blanket bundle", quantity: 90, unit: "bundles", priority: "Medium",
    location: "Balangoda, Ratnapura", requiredDate: at(4), createdAt: at(-7), status: "Cancelled",
    description: "Cold nights at the highland shelter.",
    timeline: [
      { status: "Pending", at: at(-7) },
      { status: "Cancelled", at: at(-6), note: "Requester sourced locally" },
    ],
  },
  {
    id: "req-11", code: "REQ-2461", orgId: "org-3", requester: "Dilhani Gunasekara", requesterPhone: "+94 71 442 3399",
    category: "Food", resourceType: "Dry ration pack", quantity: 210, unit: "packs", priority: "Critical",
    location: "Ambalangoda, Galle", requiredDate: at(1), createdAt: at(0), status: "Pending",
    description: "Coastal flooding displaced 210 families overnight.",
    timeline: [{ status: "Pending", at: at(0) }],
  },
  {
    id: "req-12", code: "REQ-2462", orgId: "org-3", requester: "Prasad Wickramasinghe", requesterPhone: "+94 77 330 5521",
    category: "Hygiene Kits", resourceType: "Family hygiene kit", quantity: 65, unit: "kits", priority: "Low",
    location: "Hikkaduwa, Galle", requiredDate: at(5), createdAt: at(-8), status: "Fulfilled",
    description: "Clean-up supplies after the seawater surge.",
    timeline: [
      { status: "Pending", at: at(-8) },
      { status: "Approved", at: at(-7) },
      { status: "Fulfilled", at: at(-4) },
    ],
  },
];

export const donations: Donation[] = [
  {
    id: "don-1", code: "DON-1180", orgId: "org-1", donorName: "Ceylon Grain Millers", donorPhone: "+94 11 555 0100",
    category: "Food", resource: "Rice 25kg sack", quantity: 120, unit: "packs", expiryDate: at(240),
    pickupLocation: "Peliyagoda warehouse", remarks: "Forklift available, collect before 5pm.",
    createdAt: at(-1), status: "Pending",
  },
  {
    id: "don-2", code: "DON-1181", orgId: "org-1", donorName: "Anoma Ratnayake", donorPhone: "+94 77 812 3344",
    category: "Clothing", resource: "Blanket bundle", quantity: 40, unit: "bundles",
    pickupLocation: "Rajagiriya residence", remarks: "New, still packaged.", createdAt: at(-2), status: "Pending",
  },
  {
    id: "don-3", code: "DON-1182", orgId: "org-1", donorName: "MedLanka Pharmaceuticals", donorPhone: "+94 11 470 2288",
    category: "Medical Supplies", resource: "First aid kit", quantity: 150, unit: "kits", expiryDate: at(120),
    pickupLocation: "Kelaniya distribution centre", remarks: "Batch verified by pharmacist.",
    createdAt: at(-4), status: "Accepted",
  },
  {
    id: "don-4", code: "DON-1183", orgId: "org-1", donorName: "Hemal Jayasuriya", donorPhone: "+94 76 220 1177",
    category: "Food", resource: "Cooked meal pack", quantity: 80, unit: "packs", expiryDate: at(-1),
    pickupLocation: "Borella", remarks: "Prepared yesterday evening.", createdAt: at(-3), status: "Rejected",
    rejectionReason: "Perishable items past safe consumption window.",
  },
  {
    id: "don-5", code: "DON-1184", orgId: "org-1", donorName: "Lions Club Colombo East", donorPhone: "+94 11 269 4400",
    category: "Hygiene Kits", resource: "Family hygiene kit", quantity: 200, unit: "kits",
    pickupLocation: "Battaramulla office", remarks: "Assembled by volunteers.", createdAt: at(-6), status: "Accepted",
  },
  {
    id: "don-6", code: "DON-1185", orgId: "org-2", donorName: "Sabaragamuwa Traders Union", donorPhone: "+94 45 222 9080",
    category: "Shelter Equipment", resource: "Tarpaulin sheet", quantity: 250, unit: "units",
    pickupLocation: "Ratnapura town depot", remarks: "Heavy duty grade.", createdAt: at(0), status: "Pending",
  },
  {
    id: "don-7", code: "DON-1186", orgId: "org-2", donorName: "Nadeeka Samarasinghe", donorPhone: "+94 71 664 2233",
    category: "Drinking Water", resource: "Bottled water 1L", quantity: 1200, unit: "litres", expiryDate: at(300),
    pickupLocation: "Kuruwita junction", remarks: "Two pallets.", createdAt: at(-2), status: "Pending",
  },
  {
    id: "don-8", code: "DON-1187", orgId: "org-2", donorName: "Highland Dairy Ltd", donorPhone: "+94 52 223 1100",
    category: "Food", resource: "Milk powder 400g", quantity: 300, unit: "packs", expiryDate: at(21),
    pickupLocation: "Balangoda plant", remarks: "Short-dated stock, distribute quickly.",
    createdAt: at(-5), status: "Accepted",
  },
  {
    id: "don-9", code: "DON-1188", orgId: "org-2", donorName: "Ravindu Ekanayake", donorPhone: "+94 78 001 5566",
    category: "Clothing", resource: "Used clothing bundle", quantity: 25, unit: "bundles",
    pickupLocation: "Pelmadulla", remarks: "Mixed sizes.", createdAt: at(-8), status: "Cancelled",
  },
  {
    id: "don-10", code: "DON-1189", orgId: "org-3", donorName: "Southern Fisheries Co-op", donorPhone: "+94 91 224 7711",
    category: "Food", resource: "Dry ration pack", quantity: 160, unit: "packs", expiryDate: at(180),
    pickupLocation: "Galle harbour store", remarks: "Packed this morning.", createdAt: at(0), status: "Pending",
  },
  {
    id: "don-11", code: "DON-1190", orgId: "org-3", donorName: "Coastal Hotels Association", donorPhone: "+94 91 438 2200",
    category: "Shelter Equipment", resource: "Camp bed", quantity: 60, unit: "units",
    pickupLocation: "Unawatuna", remarks: "Collected from three member hotels.",
    createdAt: at(-3), status: "Accepted",
  },
  {
    id: "don-12", code: "DON-1191", orgId: "org-3", donorName: "Sanduni Peiris", donorPhone: "+94 77 551 8890",
    category: "Hygiene Kits", resource: "Sanitary pack", quantity: 90, unit: "kits",
    pickupLocation: "Karapitiya", remarks: "For women and girls at the shelter.",
    createdAt: at(-1), status: "Pending",
  },
];

export const inventory: InventoryItem[] = [
  { id: "inv-1", orgId: "org-1", category: "Food", resource: "Dry ration pack", unit: "packs", available: 340, reserved: 60, allocated: 420, minThreshold: 150, warehouse: "Peliyagoda A", expiryDate: at(150) },
  { id: "inv-2", orgId: "org-1", category: "Drinking Water", resource: "Bottled water 1L", unit: "litres", available: 90, reserved: 400, allocated: 2100, minThreshold: 500, warehouse: "Peliyagoda A", expiryDate: at(280) },
  { id: "inv-3", orgId: "org-1", category: "Medical Supplies", resource: "First aid kit", unit: "kits", available: 150, reserved: 40, allocated: 85, minThreshold: 50, warehouse: "Kelaniya Clinic Store", expiryDate: at(12) },
  { id: "inv-4", orgId: "org-1", category: "Shelter Equipment", resource: "Tarpaulin sheet", unit: "units", available: 210, reserved: 30, allocated: 145, minThreshold: 80, warehouse: "Peliyagoda B" },
  { id: "inv-5", orgId: "org-1", category: "Hygiene Kits", resource: "Family hygiene kit", unit: "kits", available: 260, reserved: 0, allocated: 120, minThreshold: 100, warehouse: "Battaramulla" },
  { id: "inv-6", orgId: "org-2", category: "Shelter Equipment", resource: "Family tent", unit: "units", available: 18, reserved: 12, allocated: 64, minThreshold: 40, warehouse: "Ratnapura Depot" },
  { id: "inv-7", orgId: "org-2", category: "Food", resource: "Milk powder 400g", unit: "packs", available: 300, reserved: 0, allocated: 0, minThreshold: 100, warehouse: "Balangoda Store", expiryDate: at(21) },
  { id: "inv-8", orgId: "org-2", category: "Drinking Water", resource: "Water bowser run", unit: "litres", available: 12000, reserved: 8000, allocated: 24000, minThreshold: 5000, warehouse: "Ratnapura Depot" },
  { id: "inv-9", orgId: "org-2", category: "Medical Supplies", resource: "Chronic medicine pack", unit: "kits", available: 22, reserved: 55, allocated: 30, minThreshold: 60, warehouse: "Kuruwita Clinic", expiryDate: at(75) },
  { id: "inv-10", orgId: "org-3", category: "Food", resource: "Dry ration pack", unit: "packs", available: 410, reserved: 100, allocated: 260, minThreshold: 150, warehouse: "Galle Harbour Store", expiryDate: at(170) },
  { id: "inv-11", orgId: "org-3", category: "Shelter Equipment", resource: "Camp bed", unit: "units", available: 60, reserved: 0, allocated: 25, minThreshold: 30, warehouse: "Unawatuna Hall" },
  { id: "inv-12", orgId: "org-3", category: "Hygiene Kits", resource: "Sanitary pack", unit: "kits", available: 48, reserved: 20, allocated: 90, minThreshold: 60, warehouse: "Karapitiya" },
];

export const volunteers: Volunteer[] = [
  { id: "vol-1", orgId: "org-1", name: "Dinesh Weerasinghe", email: "dinesh.w@mail.lk", phone: "+94 77 100 2233", skills: ["Logistics", "Transportation"], experienceYears: 6, location: "Kolonnawa", availability: "Available", verification: "Approved", tasksCompleted: 34, rating: 4.8, joinedAt: at(-500) },
  { id: "vol-2", orgId: "org-1", name: "Sachini Fernando", email: "sachini.f@mail.lk", phone: "+94 71 220 9988", skills: ["Medical Assistance", "Food Distribution"], experienceYears: 3, location: "Angoda", availability: "Busy", verification: "Approved", tasksCompleted: 21, rating: 4.6, joinedAt: at(-320) },
  { id: "vol-3", orgId: "org-1", name: "Ishara Madushanka", email: "ishara.m@mail.lk", phone: "+94 76 543 1122", skills: ["Emergency Rescue", "Logistics"], experienceYears: 8, location: "Wellampitiya", availability: "Available", verification: "Approved", tasksCompleted: 52, rating: 4.9, joinedAt: at(-700) },
  { id: "vol-4", orgId: "org-1", name: "Nuwan Chathuranga", email: "nuwan.c@mail.lk", phone: "+94 70 887 6655", skills: ["Food Distribution"], experienceYears: 1, location: "Mulleriyawa", availability: "Available", verification: "Pending", tasksCompleted: 0, rating: 0, joinedAt: at(-3) },
  { id: "vol-5", orgId: "org-1", name: "Hasini Rajapaksha", email: "hasini.r@mail.lk", phone: "+94 77 665 4433", skills: ["Medical Assistance"], experienceYears: 4, location: "Kotikawatta", availability: "Unavailable", verification: "Approved", tasksCompleted: 18, rating: 4.4, joinedAt: at(-260) },
  { id: "vol-6", orgId: "org-2", name: "Kasun Abeywickrama", email: "kasun.a@mail.lk", phone: "+94 78 221 3344", skills: ["Emergency Rescue", "Transportation"], experienceYears: 7, location: "Eheliyagoda", availability: "Available", verification: "Approved", tasksCompleted: 41, rating: 4.7, joinedAt: at(-450) },
  { id: "vol-7", orgId: "org-2", name: "Thilini Senanayake", email: "thilini.s@mail.lk", phone: "+94 71 774 8899", skills: ["Logistics", "Food Distribution"], experienceYears: 2, location: "Kuruwita", availability: "Busy", verification: "Approved", tasksCompleted: 12, rating: 4.2, joinedAt: at(-180) },
  { id: "vol-8", orgId: "org-2", name: "Buddhika Rathnayake", email: "buddhika.r@mail.lk", phone: "+94 77 332 1100", skills: ["Medical Assistance", "Emergency Rescue"], experienceYears: 5, location: "Pelmadulla", availability: "Available", verification: "Pending", tasksCompleted: 0, rating: 0, joinedAt: at(-2) },
  { id: "vol-9", orgId: "org-2", name: "Amaya Liyanage", email: "amaya.l@mail.lk", phone: "+94 76 009 2211", skills: ["Transportation"], experienceYears: 1, location: "Balangoda", availability: "Unavailable", verification: "Rejected", tasksCompleted: 0, rating: 0, joinedAt: at(-40) },
  { id: "vol-10", orgId: "org-3", name: "Roshan de Silva", email: "roshan.d@mail.lk", phone: "+94 91 445 6677", skills: ["Logistics", "Emergency Rescue"], experienceYears: 9, location: "Ambalangoda", availability: "Available", verification: "Approved", tasksCompleted: 63, rating: 4.9, joinedAt: at(-820) },
  { id: "vol-11", orgId: "org-3", name: "Piumi Wijesekara", email: "piumi.w@mail.lk", phone: "+94 77 118 3344", skills: ["Food Distribution", "Medical Assistance"], experienceYears: 3, location: "Hikkaduwa", availability: "Available", verification: "Approved", tasksCompleted: 27, rating: 4.5, joinedAt: at(-300) },
  { id: "vol-12", orgId: "org-3", name: "Janith Karunaratne", email: "janith.k@mail.lk", phone: "+94 70 552 9900", skills: ["Transportation"], experienceYears: 2, location: "Karapitiya", availability: "Busy", verification: "Pending", tasksCompleted: 0, rating: 0, joinedAt: at(-6) },
];

export const tasks: Task[] = [
  { id: "task-1", orgId: "org-1", title: "Water bowser escort to Kolonnawa", description: "Escort and supervise distribution of 600L bottled water across four collection points.", location: "Kolonnawa", requiredSkills: ["Transportation", "Logistics"], priority: "Critical", deadline: at(1), assignees: ["vol-1"], status: "In Progress", progress: 45, createdAt: at(-1) },
  { id: "task-2", orgId: "org-1", title: "Medical camp support - Angoda", description: "Assist the visiting medical officer with triage and record keeping.", location: "Angoda", requiredSkills: ["Medical Assistance"], priority: "High", deadline: at(0), assignees: ["vol-2", "vol-5"], status: "Accepted", progress: 10, createdAt: at(-2) },
  { id: "task-3", orgId: "org-1", title: "Tarpaulin distribution - Mulleriyawa", description: "Deliver and install 45 tarpaulin sheets on damaged roofs.", location: "Mulleriyawa", requiredSkills: ["Logistics"], priority: "Medium", deadline: at(-1), assignees: ["vol-3"], status: "Assigned", progress: 0, createdAt: at(-4) },
  { id: "task-4", orgId: "org-1", title: "Hygiene kit packing", description: "Pack 200 family hygiene kits at the Battaramulla store.", location: "Battaramulla", requiredSkills: ["Food Distribution"], priority: "Low", deadline: at(-3), assignees: ["vol-3", "vol-1"], status: "Completed", progress: 100, createdAt: at(-7) },
  { id: "task-5", orgId: "org-2", title: "Tent setup at Eheliyagoda shelter", description: "Erect 30 family tents on the temple grounds.", location: "Eheliyagoda", requiredSkills: ["Emergency Rescue", "Logistics"], priority: "Critical", deadline: at(1), assignees: ["vol-6"], status: "Accepted", progress: 20, createdAt: at(-1) },
  { id: "task-6", orgId: "org-2", title: "Chronic medicine delivery run", description: "Deliver medicine packs to five elderly households cut off by the slide.", location: "Kuruwita", requiredSkills: ["Medical Assistance", "Transportation"], priority: "High", deadline: at(-1), assignees: ["vol-7"], status: "In Progress", progress: 60, createdAt: at(-3) },
  { id: "task-7", orgId: "org-2", title: "Warehouse stock audit", description: "Recount depot stock after the weekend intake.", location: "Ratnapura Depot", requiredSkills: ["Logistics"], priority: "Low", deadline: at(4), assignees: [], status: "Assigned", progress: 0, createdAt: at(-2) },
  { id: "task-8", orgId: "org-3", title: "Coastal ration distribution", description: "Distribute 210 dry ration packs across Ambalangoda ward 3.", location: "Ambalangoda", requiredSkills: ["Food Distribution", "Logistics"], priority: "Critical", deadline: at(2), assignees: ["vol-10", "vol-11"], status: "In Progress", progress: 35, createdAt: at(0) },
  { id: "task-9", orgId: "org-3", title: "Shelter clean-up - Hikkaduwa", description: "Post-surge clean up of the community shelter.", location: "Hikkaduwa", requiredSkills: ["Food Distribution"], priority: "Medium", deadline: at(-2), assignees: ["vol-11"], status: "Completed", progress: 100, createdAt: at(-6) },
];

export const users: PlatformUser[] = [
  { id: "usr-1", name: "Dilhara Weerasinghe", email: "dilhara@kvrelief.lk", phone: "+94 77 400 1122", role: "Organization Coordinator", district: "Colombo", status: "Active", joinedAt: at(-600) },
  { id: "usr-2", name: "Nimali Perera", email: "nimali.p@mail.lk", phone: "+94 77 123 4567", role: "Community Member", district: "Colombo", status: "Active", joinedAt: at(-120) },
  { id: "usr-3", name: "Ceylon Grain Millers", email: "csr@ceylongrain.lk", phone: "+94 11 555 0100", role: "Donor", district: "Gampaha", status: "Active", joinedAt: at(-340) },
  { id: "usr-4", name: "Ishara Madushanka", email: "ishara.m@mail.lk", phone: "+94 76 543 1122", role: "Volunteer", district: "Colombo", status: "Active", joinedAt: at(-700) },
  { id: "usr-5", name: "Buddhika Rathnayake", email: "buddhika.r@mail.lk", phone: "+94 77 332 1100", role: "Volunteer", district: "Ratnapura", status: "Pending Verification", joinedAt: at(-2) },
  { id: "usr-6", name: "Amaya Liyanage", email: "amaya.l@mail.lk", phone: "+94 76 009 2211", role: "Volunteer", district: "Ratnapura", status: "Suspended", joinedAt: at(-40) },
  { id: "usr-7", name: "Roshan de Silva", email: "roshan.d@mail.lk", phone: "+94 91 445 6677", role: "Organization Coordinator", district: "Galle", status: "Active", joinedAt: at(-820) },
  { id: "usr-8", name: "Sanduni Peiris", email: "sanduni.p@mail.lk", phone: "+94 77 551 8890", role: "Donor", district: "Galle", status: "Active", joinedAt: at(-90) },
  { id: "usr-9", name: "Kavindu Rathnasiri", email: "admin@resqhub.lk", phone: "+94 11 700 8899", role: "System Administrator", district: "Colombo", status: "Active", joinedAt: at(-900) },
  { id: "usr-10", name: "Malith Gunaratne", email: "malith.g@mail.lk", phone: "+94 70 445 2211", role: "Community Member", district: "Badulla", status: "Disabled", joinedAt: at(-210) },
];

export const auditLog: AuditEntry[] = [
  { id: "aud-1", actor: "Dilhara Weerasinghe", action: "Approved request REQ-2453", target: "Request Service", service: "Request", at: at(-3) },
  { id: "aud-2", actor: "Dilhara Weerasinghe", action: "Accepted donation DON-1182", target: "Resource Service", service: "Resource", at: at(-4) },
  { id: "aud-3", actor: "Kavindu Rathnasiri", action: "Verified organization Galle Coastal Aid Foundation", target: "Organization Service", service: "Organization", at: at(-14) },
  { id: "aud-4", actor: "Kavindu Rathnasiri", action: "Changed role of Roshan de Silva to Organization Coordinator", target: "User Service", service: "User", at: at(-20) },
  { id: "aud-5", actor: "Roshan de Silva", action: "Assigned task Coastal ration distribution", target: "Task Service", service: "Task", at: at(0) },
  { id: "aud-6", actor: "System", action: "Low stock alert raised for Bottled water 1L", target: "Resource Service", service: "Resource", at: at(-1) },
  { id: "aud-7", actor: "Kavindu Rathnasiri", action: "Suspended account Amaya Liyanage", target: "User Service", service: "User", at: at(-11) },
  { id: "aud-8", actor: "Dilhara Weerasinghe", action: "Rejected donation DON-1183", target: "Resource Service", service: "Resource", at: at(-3) },
];

export const notifications: AppNotification[] = [
  { id: "nt-1", title: "Critical request submitted", description: "REQ-2451 needs 600L of drinking water in Kolonnawa.", type: "Request", at: at(-1), read: false },
  { id: "nt-2", title: "New donation awaiting verification", description: "Ceylon Grain Millers offered 120 rice sacks.", type: "Donation", at: at(-1), read: false },
  { id: "nt-3", title: "Low stock alert", description: "Bottled water 1L is below the minimum threshold.", type: "Inventory", at: at(-1), read: false },
  { id: "nt-4", title: "Volunteer registration pending", description: "Nuwan Chathuranga applied to join your organization.", type: "Volunteer", at: at(-3), read: true },
  { id: "nt-5", title: "Task overdue", description: "Tarpaulin distribution - Mulleriyawa passed its deadline.", type: "Task", at: at(-1), read: true },
  { id: "nt-6", title: "Organization verified", description: "Galle Coastal Aid Foundation was approved by an administrator.", type: "Organization", at: at(-14), read: true },
];
