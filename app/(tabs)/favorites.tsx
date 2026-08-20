import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "../../convex/_generated/api";
import { ToiletCard } from "../../components/ToiletCard";
import { useLocation } from "../../hooks/useLocation";
import { distanceMeters, formatDistance } from "../../lib/geo";
import Colors from "../../constants/Colors";
import { Toilet } from "../../types";

export default function FavoritesScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const { location } = useLocation();

  const favorites = useQuery(
    api.favorites.getFavoriteToilets,
    userId ? { clerkId: userId } : "skip"
  );

  const sorted = useMemo(() => {
    const list = (favorites ?? []) as Toilet[];
    if (!location) return list;
    return [...list].sort(
      (a, b) =>
        distanceMeters(location.coords.latitude, location.coords.longitude, a.latitude, a.longitude) -
        distanceMeters(location.coords.latitude, location.coords.longitude, b.latitude, b.longitude)
    );
  }, [favorites, location]);

  const distanceLabel = (t: Toilet) =>
    location
      ? formatDistance(
          distanceMeters(location.coords.latitude, location.coords.longitude, t.latitude, t.longitude)
        )
      : undefined;

  if (favorites === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (sorted.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>♡</Text>
        <Text style={styles.emptyTitle}>お気に入りはありません</Text>
        <Text style={styles.emptySubtitle}>
          トイレの詳細画面からお気に入り登録できます
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={sorted}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <ToiletCard
          toilet={item}
          distanceLabel={distanceLabel(item)}
          onPress={() => router.push(`/toilet/${item._id}`)}
        />
      )}
      contentContainerStyle={styles.list}
    />
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
    color: Colors.favorite,
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
