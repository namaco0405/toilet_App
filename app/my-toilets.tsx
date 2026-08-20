import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { Stack, useRouter } from "expo-router";
import { api } from "../convex/_generated/api";
import { ToiletCard } from "../components/ToiletCard";
import Colors from "../constants/Colors";
import { Toilet } from "../types";

export default function MyToiletsScreen() {
  const { userId } = useAuth();
  const router = useRouter();

  const myToilets = useQuery(
    api.toilets.getMyToilets,
    userId ? { clerkId: userId } : "skip"
  );
  const deleteToilet = useMutation(api.toilets.deleteToilet);

  const handleDelete = (toiletId: string, name: string) => {
    if (!userId) return;
    Alert.alert("削除確認", `「${name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteToilet({ clerkId: userId, toiletId: toiletId as any });
          } catch (err: any) {
            Alert.alert("エラー", err.message || "削除に失敗しました");
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "自分が登録したトイレ" }} />
      {myToilets === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : myToilets.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🚽</Text>
          <Text style={styles.emptyTitle}>まだ登録がありません</Text>
          <Text style={styles.emptySubtitle}>
            「追加」タブからトイレを登録しましょう
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.container}
          data={myToilets as Toilet[]}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.itemWrapper}>
              <ToiletCard
                toilet={item}
                onPress={() => router.push(`/toilet/${item._id}`)}
              />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item._id, item.name)}
              >
                <Text style={styles.deleteBtnText}>🗑️ 削除</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingVertical: 12,
  },
  itemWrapper: {
    position: "relative",
  },
  deleteBtn: {
    position: "absolute",
    right: 28,
    top: 14,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteBtnText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
    backgroundColor: Colors.background,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
