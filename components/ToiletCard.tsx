import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Toilet } from "../types";
import { FEE_LABELS, HOURS_LABELS } from "../constants/Facilities";
import { formatRelativeTime } from "../lib/geo";
import Colors from "../constants/Colors";

interface Props {
  toilet: Toilet;
  onPress?: () => void;
  distanceLabel?: string;
}

export function ToiletCard({ toilet, onPress, distanceLabel }: Props) {
  const imageUrl = useQuery(
    api.storage.getImageUrl,
    toilet.imageStorageId
      ? { storageId: toilet.imageStorageId as Id<"_storage"> }
      : "skip"
  );

  const avgCleanliness =
    toilet.cleanlinessCount > 0
      ? toilet.cleanlinessSum / toilet.cleanlinessCount
      : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.row}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🚽</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {toilet.name}
          </Text>
          <View style={styles.metaRow}>
            {distanceLabel ? (
              <Text style={styles.meta}>📍 {distanceLabel}</Text>
            ) : null}
            <Text style={styles.meta}>
              {toilet.hoursType === "24h" ? "🕐 24時間" : HOURS_LABELS[toilet.hoursType]}
            </Text>
            <Text
              style={[
                styles.feeBadge,
                toilet.fee === "free" && styles.feeBadgeFree,
              ]}
            >
              {FEE_LABELS[toilet.fee]}
            </Text>
          </View>
          {avgCleanliness !== null ? (
            <Text style={styles.rating}>
              ⭐ {avgCleanliness.toFixed(1)}（{toilet.cleanlinessCount}件）
            </Text>
          ) : null}
          <View style={styles.footer}>
            {toilet.lastConfirmedAt ? (
              <Text style={styles.confirmed}>
                最終確認 {formatRelativeTime(toilet.lastConfirmedAt)}
              </Text>
            ) : (
              <Text style={styles.confirmedNone}>未確認</Text>
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  meta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  feeBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    backgroundColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  feeBadgeFree: {
    color: Colors.accent,
    backgroundColor: "#f0fdfa",
  },
  rating: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  confirmed: {
    fontSize: 11,
    color: Colors.textLight,
  },
  confirmedNone: {
    fontSize: 11,
    color: Colors.textLight,
    fontStyle: "italic",
  },
});
