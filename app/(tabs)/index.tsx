import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView from "react-native-maps";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { api } from "../../convex/_generated/api";
import { ToiletMarker } from "../../components/ToiletMarker";
import { useLocation } from "../../hooks/useLocation";
import Colors from "../../constants/Colors";
import { Toilet } from "../../types";

type FilterMode = "all" | "mine" | "friends";

export default function MapScreen() {
  const { userId } = useAuth();
  const posthog = usePostHog();
  const mapRef = useRef<MapView>(null);
  const [filter, setFilter] = useState<FilterMode>("all");

  const { region, setRegion, location, loading, getCurrentLocation } =
    useLocation();

  const visibleData = useQuery(
    api.toilets.getAllVisibleToilets,
    userId ? { clerkId: userId } : "skip"
  );

  useEffect(() => {
    posthog?.capture("map_viewed");
  }, []);

  const myToilets = visibleData?.myToilets ?? [];
  const friendsToilets = visibleData?.friendsToilets ?? [];

  const displayedMyToilets =
    filter === "friends" ? [] : myToilets;
  const displayedFriendsToilets =
    filter === "mine" ? [] : friendsToilets;

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
    // Could navigate to detail screen in future
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
      >
        {displayedMyToilets.map((toilet) => (
          <ToiletMarker
            key={toilet._id}
            toilet={toilet as Toilet}
            isOwn={true}
            onPress={handleMarkerPress}
          />
        ))}
        {displayedFriendsToilets.map((toilet) => (
          <ToiletMarker
            key={toilet._id}
            toilet={toilet as Toilet}
            isOwn={false}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        {(["all", "mine", "friends"] as FilterMode[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all" ? "すべて" : f === "mine" ? "自分" : "フレンド"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.myMarker }]} />
          <Text style={styles.legendText}>自分</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.friendMarker }]} />
          <Text style={styles.legendText}>フレンド</Text>
        </View>
      </View>

      {/* Current location button */}
      <TouchableOpacity
        style={styles.locateButton}
        onPress={handleLocateMe}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Text style={styles.locateIcon}>📍</Text>
        )}
      </TouchableOpacity>

      {/* Toilet count badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>
          🚽 {displayedMyToilets.length + displayedFriendsToilets.length}件
        </Text>
      </View>
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
  filterContainer: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
  },
  legend: {
    position: "absolute",
    bottom: 100,
    left: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "500",
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
  locateIcon: {
    fontSize: 24,
  },
  countBadge: {
    position: "absolute",
    top: 64,
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
});
