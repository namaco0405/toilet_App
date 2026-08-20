import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { CONGESTION_ICONS, CONGESTION_LABELS, CONGESTION_LEVELS } from "../../../constants/Facilities";
import Colors from "../../../constants/Colors";
import { ConfirmStatus, CongestionLevel } from "../../../types";

const STATUS_OPTIONS: [ConfirmStatus, string, string][] = [
  ["available", "利用できた", "✅"],
  ["unavailable", "利用できなかった", "❌"],
  ["unknown", "わからない", "❔"],
];

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const router = useRouter();

  const toilet = useQuery(api.toilets.getToiletById, { toiletId: id as Id<"toilets"> });
  const createReport = useMutation(api.reports.createReport);

  const [status, setStatus] = useState<ConfirmStatus | null>(null);
  const [congestion, setCongestion] = useState<CongestionLevel | null>(null);
  const [cleanliness, setCleanliness] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;
    if (!status) {
      Alert.alert("エラー", "現在利用できるか選択してください");
      return;
    }

    setLoading(true);
    try {
      await createReport({
        clerkId: userId,
        toiletId: id as Id<"toilets">,
        status,
        congestion: congestion ?? undefined,
        cleanliness: cleanliness > 0 ? cleanliness : undefined,
        comment: comment.trim() || undefined,
      });
      Alert.alert("報告ありがとうございます", "情報を更新しました", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("エラー", err.message || "報告に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "利用状況の報告" }} />
      <View style={styles.container}>
        <Text style={styles.toiletName}>{toilet?.name ?? ""}</Text>
        <Text style={styles.question}>このトイレは現在利用できますか？</Text>

        <View style={styles.statusList}>
          {STATUS_OPTIONS.map(([value, label, icon]) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.statusBtn,
                status === value && {
                  borderColor: statusColor(value),
                  backgroundColor:
                    value === "available"
                      ? "#f0fdf4"
                      : value === "unavailable"
                      ? "#fef2f2"
                      : Colors.borderLight,
                },
              ]}
              onPress={() => setStatus(value)}
            >
              <Text style={styles.statusIcon}>{icon}</Text>
              <Text
                style={[styles.statusLabel, status === value && styles.statusLabelActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>あわせて情報を更新しますか？</Text>

        <Text style={styles.label}>混雑度</Text>
        <View style={styles.congestionRow}>
          {CONGESTION_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.congestionBtn, congestion === level && styles.congestionBtnActive]}
              onPress={() => setCongestion(congestion === level ? null : level)}
            >
              <Text style={styles.congestionIcon}>{CONGESTION_ICONS[level]}</Text>
              <Text
                style={[
                  styles.congestionLabel,
                  congestion === level && styles.congestionLabelActive,
                ]}
              >
                {CONGESTION_LABELS[level]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>清潔度</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setCleanliness(n === cleanliness ? 0 : n)}>
              <Text style={[styles.star, n <= cleanliness && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>コメント（任意）</Text>
        <TextInput
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          placeholder="とてもきれいでした"
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={3}
          maxLength={200}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>報告する</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const statusColor = (value: ConfirmStatus) =>
  value === "available" ? Colors.success : value === "unavailable" ? Colors.error : Colors.textSecondary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
    gap: 10,
  },
  toiletName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  question: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 6,
  },
  statusList: {
    gap: 10,
    marginBottom: 8,
  },
  statusBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  statusIcon: {
    fontSize: 18,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  statusLabelActive: {
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 6,
  },
  congestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  congestionBtn: {
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  congestionBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  congestionIcon: {
    fontSize: 18,
  },
  congestionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  congestionLabelActive: {
    color: Colors.primary,
  },
  starRow: {
    flexDirection: "row",
    gap: 6,
  },
  star: {
    fontSize: 30,
    color: Colors.starEmpty,
  },
  starActive: {
    color: Colors.star,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    height: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 12,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
