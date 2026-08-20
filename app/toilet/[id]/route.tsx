import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams } from "expo-router";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useLocation } from "../../../hooks/useLocation";
import { distanceMeters, formatDistance, walkMinutes } from "../../../lib/geo";
import Colors from "../../../constants/Colors";

export default function RouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView>(null);
  const { location, getCurrentLocation } = useLocation();

  const toilet = useQuery(api.toilets.getToiletById, { toiletId: id as Id<"toilets"> });

  useEffect(() => {
    if (!location) getCurrentLocation();
  }, []);

  useEffect(() => {
    if (!toilet || !location || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      [
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        { latitude: toilet.latitude, longitude: toilet.longitude },
      ],
      { edgePadding: { top: 80, right: 80, bottom: 220, left: 80 }, animated: true }
    );
  }, [toilet, location]);

  if (toilet === undefined || location === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.loadingText}>現在地を取得しています...</Text>
      </View>
    );
  }

  if (toilet === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>トイレが見つかりません</Text>
      </View>
    );
  }

  const dist = distanceMeters(
    location.coords.latitude,
    location.coords.longitude,
    toilet.latitude,
    toilet.longitude
  );

  return (
    <>
      <Stack.Screen options={{ title: "経路案内" }} />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation
          initialRegion={{
            latitude: (location.coords.latitude + toilet.latitude) / 2,
            longitude: (location.coords.longitude + toilet.longitude) / 2,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          <Marker
            coordinate={{ latitude: toilet.latitude, longitude: toilet.longitude }}
            title={toilet.name}
            pinColor={Colors.primary}
          />
          <Polyline
            coordinates={[
              { latitude: location.coords.latitude, longitude: location.coords.longitude },
              { latitude: toilet.latitude, longitude: toilet.longitude },
            ]}
            strokeColor={Colors.primary}
            strokeWidth={4}
            lineDashPattern={[8, 6]}
          />
        </MapView>

        <View style={styles.sheet}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryDistance}>{formatDistance(dist)}</Text>
              <Text style={styles.summaryTime}>徒歩約{walkMinutes(dist)}分</Text>
            </View>
            <Text style={styles.destName} numberOfLines={1}>
              {toilet.name}
            </Text>
          </View>

          <View style={styles.stepList}>
            <View style={styles.step}>
              <Text style={styles.stepDot}>●</Text>
              <Text style={styles.stepLabel}>現在地</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <Text style={styles.stepDot}>📍</Text>
              <Text style={styles.stepLabel}>{toilet.name}</Text>
              <Text style={styles.stepDist}>{formatDistance(dist)}</Text>
            </View>
          </View>
          <Text style={styles.hint}>
            直線距離の目安です。実際の道順は地図アプリと合わせてご確認ください。
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryDistance: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
  },
  summaryTime: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  destName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    maxWidth: "50%",
    textAlign: "right",
  },
  stepList: {
    gap: 4,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepDot: {
    fontSize: 12,
    color: Colors.primary,
    width: 20,
    textAlign: "center",
  },
  stepLine: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 10,
  },
  stepLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
    flex: 1,
  },
  stepDist: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  hint: {
    fontSize: 11,
    color: Colors.textLight,
  },
});
