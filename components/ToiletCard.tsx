import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Toilet } from "../types";
import { ToiletTypeIcon } from "./ToiletTypeIcon";
import Colors from "../constants/Colors";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface Props {
  toilet: Toilet;
  isOwn?: boolean;
  onPress?: () => void;
  ownerName?: string;
}

export function ToiletCard({ toilet, isOwn = true, onPress, ownerName }: Props) {
  const imageUrl = useQuery(
    api.storage.getImageUrl,
    toilet.imageStorageId
      ? { storageId: toilet.imageStorageId as Id<"_storage"> }
      : "skip"
  );

  const formattedDate = new Date(toilet.createdAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📷</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {toilet.name}
          </Text>
          <ToiletTypeIcon type={toilet.type} size="sm" />
          {toilet.notes ? (
            <Text style={styles.notes} numberOfLines={2}>
              {toilet.notes}
            </Text>
          ) : null}
          <View style={styles.footer}>
            <Text style={styles.date}>{formattedDate}</Text>
            {!isOwn && ownerName ? (
              <Text style={styles.owner}>👤 {ownerName}</Text>
            ) : null}
            {isOwn ? (
              <View style={styles.ownBadge}>
                <Text style={styles.ownBadgeText}>自分</Text>
              </View>
            ) : (
              <View style={styles.friendBadge}>
                <Text style={styles.friendBadgeText}>フレンド</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  notes: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: Colors.textLight,
    flex: 1,
  },
  owner: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  ownBadge: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ownBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: "600",
  },
  friendBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  friendBadgeText: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: "600",
  },
});
