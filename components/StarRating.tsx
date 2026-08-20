import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../constants/Colors";

interface Props {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
}

export function StarRating({ value, count, size = 14, showValue = true }: Props) {
  const rounded = Math.round(value);

  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Text
            key={i}
            style={{ fontSize: size, color: i <= rounded ? Colors.star : Colors.starEmpty }}
          >
            ★
          </Text>
        ))}
      </View>
      {showValue && (
        <Text style={styles.value}>
          {value > 0 ? value.toFixed(1) : "-"}
          {count !== undefined ? ` (${count})` : ""}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stars: {
    flexDirection: "row",
  },
  value: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
