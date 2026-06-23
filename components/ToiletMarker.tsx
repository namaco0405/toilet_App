import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker, Callout } from "react-native-maps";
import { Toilet } from "../types";
import { TOILET_TYPE_ICONS, TOILET_TYPE_LABELS } from "../constants/ToiletTypes";
import Colors from "../constants/Colors";

interface Props {
  toilet: Toilet;
  isOwn?: boolean;
  onPress?: (toilet: Toilet) => void;
}

export function ToiletMarker({ toilet, isOwn = true, onPress }: Props) {
  const markerColor = isOwn ? Colors.myMarker : Colors.friendMarker;

  return (
    <Marker
      coordinate={{
        latitude: toilet.latitude,
        longitude: toilet.longitude,
      }}
      onPress={() => onPress?.(toilet)}
    >
      <View style={[styles.markerContainer, { backgroundColor: markerColor }]}>
        <Text style={styles.icon}>{TOILET_TYPE_ICONS[toilet.type]}</Text>
      </View>
      <View style={[styles.pin, { borderTopColor: markerColor }]} />
      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{toilet.name}</Text>
          <Text style={styles.calloutType}>
            {TOILET_TYPE_ICONS[toilet.type]} {TOILET_TYPE_LABELS[toilet.type]}
          </Text>
          {toilet.notes ? (
            <Text style={styles.calloutNotes} numberOfLines={2}>
              {toilet.notes}
            </Text>
          ) : null}
          <Text style={styles.calloutOwner}>
            {isOwn ? "自分が登録" : "フレンドが登録"}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
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
  callout: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
    maxWidth: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  calloutType: {
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 4,
  },
  calloutNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  calloutOwner: {
    fontSize: 11,
    color: Colors.textLight,
    fontStyle: "italic",
  },
});
