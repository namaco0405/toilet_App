import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { api } from "../convex/_generated/api";
import Colors from "../constants/Colors";
import { CONGESTION_ICONS, CONGESTION_LABELS } from "../constants/Facilities";
import { formatRelativeTime } from "../lib/geo";
import { Report, Toilet } from "../types";

const STATUS_LABELS: Record<string, string> = {
  available: "利用できた",
  unavailable: "利用できなかった",
  unknown: "わからない",
};

export default function MyReportsScreen() {
  const { userId } = useAuth();
  const router = useRouter();

  const myReports = useQuery(
    api.reports.getMyReports,
    userId ? { clerkId: userId } : "skip"
  );

  return (
    <>
      <Stack.Screen options={{ title: "利用履歴・報告履歴" }} />
      {myReports === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : myReports.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>報告履歴はありません</Text>
          <Text style={styles.emptySubtitle}>
            トイレの詳細画面から利用状況を報告できます
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.container}
          data={myReports as { report: Report; toilet: Toilet | null }[]}
          keyExtractor={(item) => item.report._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              disabled={!item.toilet}
              onPress={() => item.toilet && router.push(`/toilet/${item.toilet!._id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.toiletName} numberOfLines={1}>
                  {item.toilet?.name ?? "削除されたトイレ"}
                </Text>
                <Text style={styles.time}>
                  {formatRelativeTime(item.report.createdAt)}
                </Text>
              </View>
              <Text style={styles.status}>
                {STATUS_LABELS[item.report.status]}
              </Text>
              <View style={styles.metaRow}>
                {item.report.congestion && (
                  <Text style={styles.meta}>
                    {CONGESTION_ICONS[item.report.congestion]} {CONGESTION_LABELS[item.report.congestion]}
                  </Text>
                )}
                {item.report.cleanliness !== undefined && (
                  <Text style={styles.meta}>⭐ {item.report.cleanliness}</Text>
                )}
              </View>
              {item.report.comment ? (
                <Text style={styles.comment} numberOfLines={2}>
                  {item.report.comment}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingVertical: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toiletName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: Colors.textLight,
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  meta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  comment: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
    backgroundColor: Colors.background,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
