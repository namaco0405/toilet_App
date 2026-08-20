import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
} from "react-native";
import MapView from "react-native-maps";
import { useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { useRouter } from "expo-router";
import { api } from "../../convex/_generated/api";
import { ToiletMarker } from "../../components/ToiletMarker";
import { useLocation } from "../../hooks/useLocation";
import { useFilters } from "../../hooks/useFilters";
import { distanceMeters, formatDistance, formatRelativeTime } from "../../lib/geo";
import { FEE_LABELS, HOURS_LABELS } from "../../constants/Facilities";
import Colors from "../../constants/Colors";
import { Toilet } from "../../types";

export default function MapScreen() {
  const posthog = usePostHog();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { filters, activeCount } = useFilters();
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Toilet | null>(null);

  const { region, setRegion, location, loading, getCurrentLocation } =
    useLocation();

  const toilets = useQuery(api.toilets.searchToilets, {
    searchTerm: searchTerm || undefined,
    feeMode: filters.feeMode,
    hoursMode: filters.hoursMode,
    facilities: filters.facilities,
    insideTicketGate: filters.insideTicketGate,
    hasParking: filters.hasParking,
  });

  useEffect(() => {
    posthog?.capture("map_viewed");
  }, []);

  const list = (toilets ?? []) as Toilet[];

  const selectedDistance = useMemo(() => {
    if (!selected || !location) return null;
    return distanceMeters(
      location.coords.latitude,
      location.coords.longitude,
      selected.latitude,
      selected.longitude
    );
  }, [selected, location]);

  const handleLocateMe = async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      mapRef.current?.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  };

  const handleMarkerPress = (toilet: Toilet) => {
    setSelected(toilet);
    mapRef.current?.animateToRegion(
      {
        latitude: toilet.latitude,
        longitude: toilet.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      400
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelected(null)}
      >
        {list.map((toilet) => (
          <ToiletMarker
            key={toilet._id}
            toilet={toilet}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="このエリアを検索"
          placeholderTextColor={Colors.textLight}
          returnKeyType="search"
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

      {/* Toilet count badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>🚽 {list.length}件</Text>
      </View>

      {/* Current location button */}
      <TouchableOpacity
        style={[styles.locateButton, selected && styles.locateButtonRaised]}
        onPress={handleLocateMe}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Text style={styles.locateIcon}>📍</Text>
        )}
      </TouchableOpacity>

      {/* Selected toilet preview card */}
      {selected && (
        <TouchableOpacity
          style={styles.previewCard}
          activeOpacity={0.85}
          onPress={() => router.push(`/toilet/${selected._id}`)}
        >
          <View style={styles.previewHeader}>
            <Text style={styles.previewName} numberOfLines={1}>
              {selected.name}
            </Text>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={styles.previewClose}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.previewMetaRow}>
            {selectedDistance !== null && (
              <Text style={styles.previewMeta}>
                徒歩{Math.max(1, Math.round(selectedDistance / 80))}分 (
                {formatDistance(selectedDistance)})
              </Text>
            )}
            <Text style={styles.previewMeta}>
              {selected.hoursType === "24h" ? "24時間利用可" : HOURS_LABELS[selected.hoursType]}
            </Text>
            <Text style={styles.previewMeta}>{FEE_LABELS[selected.fee]}</Text>
          </View>
          {selected.lastConfirmedAt ? (
            <Text style={styles.previewConfirmed}>
              {selected.lastConfirmedStatus === "available" ? "✅ 利用可能" : selected.lastConfirmedStatus === "unavailable" ? "⚠️ 利用不可の報告あり" : "情報あり"}
              （{formatRelativeTime(selected.lastConfirmedAt)}に確認）
            </Text>
          ) : (
            <Text style={styles.previewConfirmedNone}>まだ利用状況の報告がありません</Text>
          )}
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewSecondaryBtn}
              onPress={() => router.push(`/toilet/${selected._id}`)}
            >
              <Text style={styles.previewSecondaryBtnText}>詳細を見る</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.previewPrimaryBtn}
              onPress={() => router.push(`/toilet/${selected._id}/route`)}
            >
              <Text style={styles.previewPrimaryBtnText}>ここへ行く</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchBar: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 6,
    height: 46,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
  },
  filterIcon: {
    fontSize: 16,
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
  countBadge: {
    position: "absolute",
    top: 66,
    alignSelf: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  locateButton: {
    position: "absolute",
    bottom: 100,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  locateButtonRaised: {
    bottom: 232,
  },
  locateIcon: {
    fontSize: 24,
  },
  previewCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewName: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
    flex: 1,
  },
  previewClose: {
    fontSize: 22,
    color: Colors.textLight,
    paddingHorizontal: 4,
  },
  previewMetaRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  previewMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  previewConfirmed: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: "600",
  },
  previewConfirmedNone: {
    fontSize: 12,
    color: Colors.textLight,
  },
  previewActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  previewSecondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.borderLight,
  },
  previewSecondaryBtnText: {
    color: Colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  previewPrimaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  previewPrimaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
