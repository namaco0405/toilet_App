import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ToiletFacilities } from "../types";
import { FACILITY_ICONS, FACILITY_LABELS } from "../constants/Facilities";
import Colors from "../constants/Colors";

interface Props {
  facility: keyof ToiletFacilities;
  active?: boolean;
}

export function FacilityBadge({ facility, active = true }: Props) {
  return (
    <View style={[styles.badge, !active && styles.badgeInactive]}>
      <Text style={styles.icon}>{FACILITY_ICONS[facility]}</Text>
      <Text style={[styles.label, !active && styles.labelInactive]}>
        {FACILITY_LABELS[facility]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primaryBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeInactive: {
    backgroundColor: Colors.borderLight,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  labelInactive: {
    color: Colors.textLight,
  },
});
