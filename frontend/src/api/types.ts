export type UUID = string;

export type RequestStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Partially Fulfilled"
  | "Fulfilled"
  | "Cancelled";

export type Priority = "Low" | "Medium" | "High" | "Critical";

export type DonationStatus = "Pending" | "Accepted" | "Rejected" | "Cancelled";

export type VerificationStatus = "Pending" | "Approved" | "Rejected";

export type Availability = "Available" | "Busy" | "Unavailable";

export type TaskStatus = "Assigned" | "Accepted" | "In Progress" | "Completed" | "Cancelled";

export type AccountStatus = "Active" | "Pending Verification" | "Suspended" | "Disabled";

export type Role =
  | "Community Member"
  | "Volunteer"
  | "Donor"
  | "Organization Coordinator"
  | "System Administrator";

export interface Organization {
  id: UUID;
  name: string;
  registrationNumber: string;
  category: string;
  district: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  verification: VerificationStatus;
  members: number;
  createdAt: string;
}

export interface ResourceCategory {
  id: UUID;
  name: string;
  description: string;
  unit: string;
  priority: Priority;
}

export interface HelpRequest {
  id: UUID;
  code: string;
  orgId: UUID;
  requester: string;
  requesterPhone: string;
  category: string;
  resourceType: string;
  quantity: number;
  unit: string;
  priority: Priority;
  location: string;
  requiredDate: string;
  createdAt: string;
  description: string;
  status: RequestStatus;
  rejectionReason?: string | undefined;
  timeline: { status: string; at: string; note?: string | undefined }[];
}

export interface Donation {
  id: UUID;
  code: string;
  orgId: UUID;
  donorName: string;
  donorPhone: string;
  category: string;
  resource: string;
  quantity: number;
  unit: string;
  expiryDate?: string | undefined;
  pickupLocation: string;
  remarks: string;
  createdAt: string;
  status: DonationStatus;
  rejectionReason?: string | undefined;
}

export interface InventoryItem {
  id: UUID;
  orgId: UUID;
  category: string;
  resource: string;
  unit: string;
  available: number;
  reserved: number;
  allocated: number;
  minThreshold: number;
  warehouse: string;
  expiryDate?: string | undefined;
}

export interface Volunteer {
  id: UUID;
  orgId: UUID;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  location: string;
  availability: Availability;
  verification: VerificationStatus;
  tasksCompleted: number;
  rating: number;
  joinedAt: string;
}

export interface Task {
  id: UUID;
  orgId: UUID;
  title: string;
  description: string;
  location: string;
  requiredSkills: string[];
  priority: Priority;
  deadline: string;
  assignees: UUID[];
  status: TaskStatus;
  progress: number;
  createdAt: string;
}

export interface PlatformUser {
  id: UUID;
  name: string;
  email: string;
  phone: string;
  role: Role;
  district: string;
  status: AccountStatus;
  joinedAt: string;
}

export interface AuditEntry {
  id: UUID;
  actor: string;
  action: string;
  target: string;
  service: string;
  at: string;
}

export interface AppNotification {
  id: UUID;
  title: string;
  description: string;
  type: "Request" | "Donation" | "Inventory" | "Volunteer" | "Task" | "Organization";
  at: string;
  read: boolean;
}

export interface DashboardSummary {
  openRequests: number;
  criticalRequests: number;
  pendingDonations: number;
  lowStock: number;
  activeVolunteers: number;
  overdueTasks: number;
  requestsByStatus: { status: RequestStatus; count: number }[];
  activity: { id: string; text: string; at: string }[];
}
