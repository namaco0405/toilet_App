import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useLocation } from "../../../hooks/useLocation";
import { FacilityBadge } from "../../../components/FacilityBadge";
import { StarRating } from "../../../components/StarRating";
import {
  FACILITY_KEYS,
  FEE_LABELS,
  HOURS_LABELS,
  CONGESTION_ICONS,
  CONGESTION_LABELS,
} from "../../../constants/Facilities";
import { distanceMeters, formatDistance, formatRelativeTime } from "../../../lib/geo";
import Colors from "../../../constants/Colors";

export default function ToiletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const router = useRouter();
  const { location } = useLocation();

  const toilet = useQuery(api.toilets.getToiletById, { toiletId: id as Id<"toilets"> });
  const imageUrl = useQuery(
    api.storage.getImageUrl,
    toilet?.imageStorageId ? { storageId: toilet.imageStorageId } : "skip"
  );
  const favoriteIds = useQuery(
    api.favorites.getFavoriteToiletIds,
    userId ? { clerkId: userId } : "skip"
  );
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  const isFavorite = favoriteIds?.includes(id as Id<"toilets">) ?? false;

  const distance = useMemo(() => {
    if (!toilet || !location) return null;
    return distanceMeters(
      location.coords.latitude,
      location.coords.longitude,
      toilet.latitude,
      toilet.longitude
    );
  }, [toilet, location]);

  const handleToggleFavorite = async () => {
    if (!userId) return;
    await toggleFavorite({ clerkId: userId, toiletId: id as Id<"toilets"> });
  };

  if (toilet === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (toilet === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>😔</Text>
        <Text style={styles.emptyTitle}>トイレが見つかりません</Text>
      </View>
    );
  }

  const avgCleanliness =
    toilet.cleanlinessCount > 0 ? toilet.cleanlinessSum / toilet.cleanlinessCount : 0;

  return (
    <>
      <Stack.Screen options={{ title: toilet.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderIcon}>🚽</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{toilet.name}</Text>
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteBtn}>
              <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>
                {isFavorite ? "♥" : "♡"}
              </Text>
            </TouchableOpacity>
          </View>

          {distance !== null && (
            <Text style={styles.distance}>
              徒歩{Math.max(1, Math.round(distance / 80))}分（{formatDistance(distance)}）
            </Text>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>営業時間</Text>
              <Text style={styles.infoValue}>
                {toilet.hoursType === "custom" && toilet.customHours
                  ? toilet.customHours
                  : HOURS_LABELS[toilet.hoursType]}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>利用料金</Text>
              <Text style={styles.infoValue}>{FEE_LABELS[toilet.fee]}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>改札内</Text>
              <Text style={styles.infoValue}>{toilet.insideTicketGate ? "はい" : "いいえ"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>駐車場</Text>
              <Text style={styles.infoValue}>{toilet.hasParking ? "あり" : "なし"}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>設備</Text>
          <View style={styles.facilityWrap}>
            {FACILITY_KEYS.map((key) => (
              <FacilityBadge key={key} facility={key} active={toilet.facilities[key]} />
            ))}
          </View>

          <Text style={styles.sectionTitle}>最終確認</Text>
          {toilet.lastConfirmedAt ? (
            <View style={styles.statusCard}>
              <Text style={styles.statusText}>
                {toilet.lastConfirmedStatus === "available"
                  ? "✅ 利用可能（ユーザー確認）"
                  : toilet.lastConfirmedStatus === "unavailable"
                  ? "⚠️ 利用できなかった報告あり"
                  : "情報あり"}
              </Text>
              <Text style={styles.statusTime}>
                {formatRelativeTime(toilet.lastConfirmedAt)}
              </Text>
              {toilet.lastCongestion && (
                <Text style={styles.congestion}>
                  混雑度：{CONGESTION_ICONS[toilet.lastCongestion]} {CONGESTION_LABELS[toilet.lastCongestion]}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.noStatus}>まだ利用状況の報告がありません</Text>
          )}

          <Text style={styles.sectionTitle}>清潔度</Text>
          <StarRating value={avgCleanliness} count={toilet.cleanlinessCount} />

          {toilet.notes ? (
            <>
              <Text style={styles.sectionTitle}>備考</Text>
              <Text style={styles.notes}>{toilet.notes}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => router.push(`/toilet/${id}/report`)}
        >
          <Text style={styles.reportBtnText}>利用状況を報告</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.routeBtn}
          onPress={() => router.push(`/toilet/${id}/route`)}
        >
          <Text style={styles.routeBtnText}>ここへ行く</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 100,
  },
  photo: {
    width: "100%",
    height: 220,
    backgroundColor: Colors.borderLight,
  },
  photoPlaceholder: {
    width: "100%",
    height: 220,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderIcon: {
    fontSize: 56,
  },
  body: {
    padding: 16,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    flex: 1,
  },
  favoriteBtn: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 28,
    color: Colors.textLight,
  },
  favoriteIconActive: {
    color: Colors.favorite,
  },
  distance: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  infoGrid: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 12,
  },
  facilityWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  statusTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  congestion: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noStatus: {
    fontSize: 13,
    color: Colors.textLight,
  },
  notes: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reportBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: Colors.borderLight,
  },
  reportBtnText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  routeBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  routeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.background,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
});
