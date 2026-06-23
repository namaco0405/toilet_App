import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ToiletType } from "../types";
import { TOILET_TYPE_LABELS, TOILET_TYPE_ICONS } from "../constants/ToiletTypes";
import Colors from "../constants/Colors";

interface Props {
  type: ToiletType;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { container: 24, fontSize: 10, iconSize: 12 },
  md: { container: 32, fontSize: 11, iconSize: 16 },
  lg: { container: 40, fontSize: 12, iconSize: 20 },
};

export function ToiletTypeIcon({ type, size = "md" }: Props) {
  const dims = SIZE_MAP[size];

  return (
    <View style={[styles.container, { minWidth: dims.container, height: dims.container }]}>
      <Text style={{ fontSize: dims.iconSize }}>{TOILET_TYPE_ICONS[type]}</Text>
      <Text style={[styles.label, { fontSize: dims.fontSize }]}>
        {TOILET_TYPE_LABELS[type]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    paddingHorizontal: 8,
    gap: 4,
  },
  label: {
    color: Colors.primaryDark,
    fontWeight: "600",
  },
});
