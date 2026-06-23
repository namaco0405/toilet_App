import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ToiletCard } from "../../components/ToiletCard";
import Colors from "../../constants/Colors";
import { Toilet } from "../../types";

export default function ProfileScreen() {
  const { signOut, userId } = useAuth();
  const { user } = useUser();

  const upsertUser = useMutation(api.users.upsertUser);
  const myToilets = useQuery(
    api.toilets.getMyToilets,
    userId ? { clerkId: userId } : "skip"
  );
  const deleteToilet = useMutation(api.toilets.deleteToilet);

  useEffect(() => {
    if (user && userId) {
      upsertUser({
        clerkId: userId,
        name: user.fullName || user.username || "ユーザー",
        email: user.primaryEmailAddress?.emailAddress || "",
        imageUrl: user.imageUrl,
      }).catch(console.error);
    }
  }, [user, userId]);

  const handleSignOut = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const handleDeleteToilet = (toiletId: string, name: string) => {
    if (!userId) return;
    Alert.alert("削除確認", `「${name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteToilet({
              clerkId: userId,
              toiletId: toiletId as any,
            });
          } catch (err: any) {
            Alert.alert("エラー", err.message || "削除に失敗しました");
          }
        },
      },
    ]);
  };

  const displayName =
    user?.fullName || user?.username || "ユーザー";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <FlatList
      style={styles.container}
      data={myToilets as Toilet[] | undefined}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.toiletItemWrapper}>
          <ToiletCard toilet={item} isOwn />
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteToilet(item._id, item.name)}
          >
            <Text style={styles.deleteBtnText}>🗑️ 削除</Text>
          </TouchableOpacity>
        </View>
      )}
      ListHeaderComponent={
        <>
          {/* Profile card */}
          <View style={styles.profileCard}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {displayName[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{email}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{myToilets?.length ?? 0}</Text>
                <Text style={styles.statLabel}>登録数</Text>
              </View>
            </View>
          </View>

          {/* My toilets section header */}
          <Text style={styles.sectionHeader}>🚽 登録したトイレ</Text>

          {myToilets === undefined && (
            <View style={styles.centered}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}

          {myToilets?.length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyIcon}>🚽</Text>
              <Text style={styles.emptyTitle}>まだ登録がありません</Text>
              <Text style={styles.emptySubtitle}>
                「追加」タブからトイレを登録しましょう
              </Text>
            </View>
          )}
        </>
      }
      ListFooterComponent={
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>ログアウト</Text>
        </TouchableOpacity>
      }
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 32,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  centered: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  toiletItemWrapper: {
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
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: "#fee2e2",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutBtnText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: "700",
  },
});
