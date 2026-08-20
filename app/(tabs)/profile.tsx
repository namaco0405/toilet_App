import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "../../convex/_generated/api";
import Colors from "../../constants/Colors";

function MenuItem({
  icon,
  label,
  count,
  onPress,
}: {
  icon: string;
  label: string;
  count?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      {count !== undefined && (
        <View style={styles.menuCount}>
          <Text style={styles.menuCountText}>{count}</Text>
        </View>
      )}
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { signOut, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const upsertUser = useMutation(api.users.upsertUser);
  const myToilets = useQuery(
    api.toilets.getMyToilets,
    userId ? { clerkId: userId } : "skip"
  );
  const favorites = useQuery(
    api.favorites.getFavoriteToilets,
    userId ? { clerkId: userId } : "skip"
  );

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
      { text: "ログアウト", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const displayName = user?.fullName || user?.username || "ユーザー";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        {email ? <Text style={styles.email}>{email}</Text> : null}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{myToilets?.length ?? 0}</Text>
            <Text style={styles.statLabel}>登録数</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{favorites?.length ?? 0}</Text>
            <Text style={styles.statLabel}>お気に入り</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <MenuItem
          icon="♡"
          label="お気に入り"
          count={favorites?.length}
          onPress={() => router.push("/(tabs)/favorites")}
        />
        <MenuItem
          icon="🚽"
          label="自分が登録したトイレ"
          count={myToilets?.length}
          onPress={() => router.push("/my-toilets")}
        />
        <MenuItem
          icon="📝"
          label="利用履歴・報告履歴"
          onPress={() => router.push("/my-reports")}
        />
      </View>

      <View style={styles.menuSection}>
        <MenuItem
          icon="🔔"
          label="通知"
          onPress={() => Alert.alert("通知", "通知設定は準備中です")}
        />
        <MenuItem
          icon="⚙️"
          label="設定"
          onPress={() => Alert.alert("設定", "設定画面は準備中です")}
        />
        <MenuItem
          icon="❓"
          label="ヘルプ・お問い合わせ"
          onPress={() => router.push("/faq")}
        />
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutBtnText}>ログアウト</Text>
      </TouchableOpacity>
    </ScrollView>
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
  menuSection: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIcon: {
    fontSize: 18,
    width: 24,
    textAlign: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  menuCount: {
    backgroundColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  menuCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  menuChevron: {
    fontSize: 20,
    color: Colors.textLight,
  },
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
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
