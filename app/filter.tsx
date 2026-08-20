import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useQuery } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { api } from "../convex/_generated/api";
import { useFilters } from "../hooks/useFilters";
import { FACILITY_KEYS, FACILITY_LABELS, FACILITY_ICONS } from "../constants/Facilities";
import Colors from "../constants/Colors";
import { ToiletFilters, DEFAULT_FILTERS } from "../types";

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map(([v, label]) => (
        <TouchableOpacity
          key={v}
          style={[styles.chip, value === v && styles.chipActive]}
          onPress={() => onChange(v)}
        >
          <Text style={[styles.chipText, value === v && styles.chipTextActive]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function FilterScreen() {
  const router = useRouter();
  const { filters, setFilters, resetFilters } = useFilters();
  const [draft, setDraft] = useState<ToiletFilters>(filters);

  const count = useQuery(api.toilets.countFiltered, {
    feeMode: draft.feeMode,
    hoursMode: draft.hoursMode,
    facilities: draft.facilities,
    insideTicketGate: draft.insideTicketGate,
    hasParking: draft.hasParking,
  });

  const toggleFacility = (key: keyof typeof draft.facilities) => {
    setDraft((d) => ({
      ...d,
      facilities: { ...d.facilities, [key]: !d.facilities[key] },
    }));
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
  };

  const handleApply = () => {
    setFilters(draft);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "絞り込み検索",
          headerRight: () => (
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetLink}>リセット</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>利用条件</Text>
          <ChipGroup
            options={[
              ["all", "すべて"],
              ["free", "無料のみ"],
              ["paid", "有料のみ"],
            ]}
            value={draft.feeMode}
            onChange={(v) => setDraft((d) => ({ ...d, feeMode: v }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>営業時間</Text>
          <ChipGroup
            options={[
              ["all", "すべて"],
              ["24h", "24時間"],
              ["open_now", "現在営業中"],
            ]}
            value={draft.hoursMode}
            onChange={(v) => setDraft((d) => ({ ...d, hoursMode: v }))}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設備</Text>
          <View style={styles.facilityList}>
            {FACILITY_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.facilityRow}
                onPress={() => toggleFacility(key)}
              >
                <Text style={styles.facilityIcon}>{FACILITY_ICONS[key]}</Text>
                <Text style={styles.facilityLabel}>{FACILITY_LABELS[key]}</Text>
                <View
                  style={[
                    styles.checkbox,
                    draft.facilities[key] && styles.checkboxChecked,
                  ]}
                >
                  {draft.facilities[key] && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他</Text>
          <View style={styles.facilityList}>
            <TouchableOpacity
              style={styles.facilityRow}
              onPress={() => setDraft((d) => ({ ...d, insideTicketGate: !d.insideTicketGate }))}
            >
              <Text style={styles.facilityIcon}>🚉</Text>
              <Text style={styles.facilityLabel}>改札内</Text>
              <View
                style={[styles.checkbox, draft.insideTicketGate && styles.checkboxChecked]}
              >
                {draft.insideTicketGate && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.facilityRow}
              onPress={() => setDraft((d) => ({ ...d, hasParking: !d.hasParking }))}
            >
              <Text style={styles.facilityIcon}>🅿️</Text>
              <Text style={styles.facilityLabel}>駐車場あり</Text>
              <View
                style={[styles.checkbox, draft.hasParking && styles.checkboxChecked]}
              >
                {draft.hasParking && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>
            この条件で検索{count !== undefined ? `（${count}件）` : ""}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 100,
  },
  resetLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  facilityList: {
    gap: 2,
  },
  facilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  facilityIcon: {
    fontSize: 16,
    width: 22,
  },
  facilityLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxMark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
