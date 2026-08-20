import { Id } from "../convex/_generated/dataModel";

export type HoursType = "24h" | "custom" | "unknown";
export type FeeType = "free" | "paid" | "unknown";
export type ConfirmStatus = "available" | "unavailable" | "unknown";
export type CongestionLevel = "empty" | "normal" | "crowded" | "very_crowded";

export interface ToiletFacilities {
  multipurpose: boolean;
  diaperChanging: boolean;
  washlet: boolean;
  ostomate: boolean;
  separateByGender: boolean;
  babyChair: boolean;
  kidsToilet: boolean;
}

export interface Toilet {
  _id: Id<"toilets">;
  _creationTime: number;
  userId: Id<"users">;
  name: string;
  latitude: number;
  longitude: number;
  hoursType: HoursType;
  customHours?: string;
  fee: FeeType;
  facilities: ToiletFacilities;
  insideTicketGate: boolean;
  hasParking: boolean;
  notes?: string;
  imageStorageId?: Id<"_storage">;
  createdAt: number;
  lastConfirmedAt?: number;
  lastConfirmedStatus?: ConfirmStatus;
  lastCongestion?: CongestionLevel;
  cleanlinessSum: number;
  cleanlinessCount: number;
}

export interface Report {
  _id: Id<"reports">;
  _creationTime: number;
  toiletId: Id<"toilets">;
  userId: Id<"users">;
  status: ConfirmStatus;
  congestion?: CongestionLevel;
  cleanliness?: number;
  comment?: string;
  createdAt: number;
}

export interface Favorite {
  _id: Id<"favorites">;
  _creationTime: number;
  userId: Id<"users">;
  toiletId: Id<"toilets">;
  createdAt: number;
}

export interface User {
  _id: Id<"users">;
  _creationTime: number;
  clerkId: string;
  name: string;
  email: string;
  imageUrl?: string;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface ToiletFilters {
  feeMode: "all" | "free" | "paid";
  hoursMode: "all" | "24h" | "open_now";
  facilities: Partial<Record<keyof ToiletFacilities, boolean>>;
  insideTicketGate: boolean;
  hasParking: boolean;
}

export const DEFAULT_FILTERS: ToiletFilters = {
  feeMode: "all",
  hoursMode: "all",
  facilities: {},
  insideTicketGate: false,
  hasParking: false,
};
