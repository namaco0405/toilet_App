import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { User, Friendship } from "../types";
import Colors from "../constants/Colors";

interface Props {
  user: User;
  friendship?: Friendship;
  mode: "friend" | "pending" | "search";
  onAccept?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  onSendRequest?: () => void;
}

export function FriendCard({
  user,
  friendship,
  mode,
  onAccept,
  onReject,
  onRemove,
  onSendRequest,
}: Props) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {user.imageUrl ? (
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
        <View style={styles.actions}>
          {mode === "friend" && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={onRemove}
            >
              <Text style={styles.removeButtonText}>削除</Text>
            </TouchableOpacity>
          )}
          {mode === "pending" && (
            <View style={styles.pendingActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={onAccept}
              >
                <Text style={styles.acceptButtonText}>承認</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={onReject}
              >
                <Text style={styles.rejectButtonText}>拒否</Text>
              </TouchableOpacity>
            </View>
          )}
          {mode === "search" && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={onSendRequest}
            >
              <Text style={styles.addButtonText}>追加</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  email: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    alignItems: "flex-end",
  },
  pendingActions: {
    flexDirection: "row",
    gap: 6,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  rejectButton: {
    backgroundColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rejectButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
