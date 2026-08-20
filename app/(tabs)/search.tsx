import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "../../convex/_generated/api";
import { ToiletCard } from "../../components/ToiletCard";
import { useLocation } from "../../hooks/useLocation";
import { useFilters } from "../../hooks/useFilters";
import { distanceMeters, formatDistance } from "../../lib/geo";
import Colors from "../../constants/Colors";
import { Toilet } from "../../types";

export default function SearchScreen() {
  const router = useRouter();
  const { location } = useLocation();
  const { filters, activeCount } = useFilters();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useQuery(api.toilets.searchToilets, {
    searchTerm: debouncedTerm || undefined,
    feeMode: filters.feeMode,
    hoursMode: filters.hoursMode,
    facilities: filters.facilities,
    insideTicketGate: filters.insideTicketGate,
    hasParking: filters.hasParking,
  });

  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedTerm(text);
    }, 400);
  }, []);

  const sorted = useMemo(() => {
    const list = (results ?? []) as Toilet[];
    if (!location) return list;
    return [...list].sort(
      (a, b) =>
        distanceMeters(location.coords.latitude, location.coords.longitude, a.latitude, a.longitude) -
        distanceMeters(location.coords.latitude, location.coords.longitude, b.latitude, b.longitude)
    );
  }, [results, location]);

  const distanceLabel = (t: Toilet) =>
    location
      ? formatDistance(
          distanceMeters(location.coords.latitude, location.coords.longitude, t.latitude, t.longitude)
        )
      : undefined;

  const isLoading = results === undefined;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={handleSearch}
          placeholder="トイレ名・メモで検索..."
          placeholderTextColor={Colors.textLight}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => router.push("/filter")}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>😔</Text>
          <Text style={styles.emptyTitle}>見つかりませんでした</Text>
          <Text style={styles.emptySubtitle}>
            キーワードや絞り込み条件を変えてみてください
          </Text>
        </View>
      ) : (
        <FlatList
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
          ListHeaderComponent={
            <Text style={styles.resultCount}>{sorted.length}件見つかりました</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
  },
  filterIcon: {
    fontSize: 15,
  },
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  list: {
    paddingBottom: 24,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
});
