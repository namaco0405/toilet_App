import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SectionList,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { usePostHog } from "posthog-react-native";
import { api } from "../../convex/_generated/api";
import { FriendCard } from "../../components/FriendCard";
import Colors from "../../constants/Colors";
import { User } from "../../types";
import { Id } from "../../convex/_generated/dataModel";

export default function FriendsScreen() {
  const { userId } = useAuth();
  const posthog = usePostHog();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const friends = useQuery(
    api.friends.getFriends,
    userId ? { clerkId: userId } : "skip"
  );
  const pendingRequests = useQuery(
    api.friends.getPendingRequests,
    userId ? { clerkId: userId } : "skip"
  );
  const searchResults = useQuery(
    api.friends.searchUsers,
    userId && debouncedTerm.length >= 2
      ? { clerkId: userId, searchTerm: debouncedTerm }
      : "skip"
  );

  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectRequest = useMutation(api.friends.rejectFriendRequest);
  const removeF = useMutation(api.friends.removeFriend);

  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedTerm(text), 400);
  }, []);

  const handleSendRequest = async (targetClerkId: string) => {
    if (!userId) return;
    try {
      await sendRequest({ clerkId: userId, addresseeClerkId: targetClerkId });
      posthog?.capture("friend_request_sent");
      Alert.alert("送信完了", "フレンドリクエストを送りました");
    } catch (err: any) {
      Alert.alert("エラー", err.message || "送信に失敗しました");
    }
  };

  const handleAccept = async (friendshipId: Id<"friendships">) => {
    if (!userId) return;
    try {
      await acceptRequest({ clerkId: userId, friendshipId });
      posthog?.capture("friend_added");
      Alert.alert("承認しました", "フレンドになりました！");
    } catch (err: any) {
      Alert.alert("エラー", err.message || "承認に失敗しました");
    }
  };

  const handleReject = async (friendshipId: Id<"friendships">) => {
    if (!userId) return;
    try {
      await rejectRequest({ clerkId: userId, friendshipId });
    } catch (err: any) {
      Alert.alert("エラー", err.message || "拒否に失敗しました");
    }
  };

  const handleRemove = async (friendshipId: Id<"friendships">, name: string) => {
    if (!userId) return;
    Alert.alert(
      "フレンドを削除",
      `${name} をフレンドから削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            try {
              await removeF({ clerkId: userId, friendshipId });
            } catch (err: any) {
              Alert.alert("エラー", err.message || "削除に失敗しました");
            }
          },
        },
      ]
    );
  };

  const isLoading = friends === undefined || pendingRequests === undefined;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const friendIds = new Set(
    friends?.map((f) => f.friend?.clerkId).filter(Boolean)
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>👥</Text>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={handleSearch}
          placeholder="ユーザーを検索（名前・メール）..."
          placeholderTextColor={Colors.textLight}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Search results */}
      {debouncedTerm.length >= 2 ? (
        <View style={styles.searchResults}>
          <Text style={styles.sectionHeader}>検索結果</Text>
          {searchResults === undefined ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
          ) : searchResults.length === 0 ? (
            <Text style={styles.emptyText}>ユーザーが見つかりません</Text>
          ) : (
            searchResults.map((user) => (
              <FriendCard
                key={user._id}
                user={user as User}
                mode={friendIds.has(user.clerkId) ? "friend" : "search"}
                onSendRequest={() => handleSendRequest(user.clerkId)}
              />
            ))
          )}
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {/* Pending requests */}
              {pendingRequests && pendingRequests.length > 0 && (
                <View>
                  <Text style={styles.sectionHeader}>
                    📬 リクエスト ({pendingRequests.length})
                  </Text>
                  {pendingRequests.map(({ friendship, requester }) =>
                    requester ? (
                      <FriendCard
                        key={friendship._id}
                        user={requester as User}
                        friendship={friendship as any}
                        mode="pending"
                        onAccept={() => handleAccept(friendship._id)}
                        onReject={() => handleReject(friendship._id)}
                      />
                    ) : null
                  )}
                </View>
              )}

              {/* Friends list */}
              <Text style={styles.sectionHeader}>
                👥 フレンド ({friends?.length ?? 0})
              </Text>
              {friends && friends.length === 0 ? (
                <View style={styles.emptyFriends}>
                  <Text style={styles.emptyIcon}>👋</Text>
                  <Text style={styles.emptyTitle}>フレンドはいません</Text>
                  <Text style={styles.emptySubtitle}>
                    検索してフレンドを追加しましょう
                  </Text>
                </View>
              ) : (
                friends?.map(({ friendship, friend }) =>
                  friend ? (
                    <FriendCard
                      key={friendship._id}
                      user={friend as User}
                      friendship={friendship as any}
                      mode="friend"
                      onRemove={() =>
                        handleRemove(friendship._id, friend.name)
                      }
                    />
                  ) : null
                )
              )}
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },
  searchResults: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 24,
  },
  emptyFriends: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
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
