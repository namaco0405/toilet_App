import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { Toilet } from "../types";
import Colors from "../constants/Colors";

interface Props {
  toilet: Toilet;
  onPress?: (toilet: Toilet) => void;
}

function markerColorFor(toilet: Toilet) {
  if (toilet.lastConfirmedStatus === "unavailable") return Colors.markerUnavailable;
  if (toilet.lastConfirmedStatus === "available") return Colors.markerAvailable;
  return Colors.markerUnknown;
}

export function ToiletMarker({ toilet, onPress }: Props) {
  const markerColor = markerColorFor(toilet);

  return (
    <Marker
      coordinate={{
        latitude: toilet.latitude,
        longitude: toilet.longitude,
      }}
      onPress={() => onPress?.(toilet)}
    >
      <View style={[styles.markerContainer, { backgroundColor: markerColor }]}>
        <Text style={styles.icon}>🚽</Text>
      </View>
      <View style={[styles.pin, { borderTopColor: markerColor }]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  icon: {
    fontSize: 18,
  },
  pin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
    marginTop: -1,
  },
});
