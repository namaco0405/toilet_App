import { Id } from "../convex/_generated/dataModel";

export type ToiletType = "japanese" | "western" | "multipurpose" | "other";

export type ToiletStatus = "pending" | "accepted" | "rejected";

export interface Toilet {
  _id: Id<"toilets">;
  _creationTime: number;
  userId: Id<"users">;
  name: string;
  type: ToiletType;
  notes?: string;
  latitude: number;
  longitude: number;
  imageStorageId?: Id<"_storage">;
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

export interface Friendship {
  _id: Id<"friendships">;
  _creationTime: number;
  requesterId: Id<"users">;
  addresseeId: Id<"users">;
  status: ToiletStatus;
}

export interface FriendWithInfo {
  friendship: Friendship;
  friend: User | null;
}

export interface PendingRequestWithInfo {
  friendship: Friendship;
  requester: User | null;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
