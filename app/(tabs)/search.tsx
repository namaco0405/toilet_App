import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ToiletCard } from "../../components/ToiletCard";
import Colors from "../../constants/Colors";
import { Toilet } from "../../types";

export default function SearchScreen() {
  const { userId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useQuery(
    api.toilets.searchToilets,
    userId && debouncedTerm.length >= 1
      ? { clerkId: userId, searchTerm: debouncedTerm }
      : "skip"
  );

  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedTerm(text);
    }, 400);
  }, []);

  const isLoading = results === undefined && debouncedTerm.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={searchTerm}
          onChangeText={handleSearch}
          placeholder="トイレ名・メモで検索..."
          placeholderTextColor={Colors.textLight}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : debouncedTerm.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>トイレを検索</Text>
          <Text style={styles.emptySubtitle}>
            名前やメモで検索できます{"\n"}自分・フレンドのトイレが対象です
          </Text>
        </View>
      ) : results && results.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>😔</Text>
          <Text style={styles.emptyTitle}>見つかりませんでした</Text>
          <Text style={styles.emptySubtitle}>
            別のキーワードで試してください
          </Text>
        </View>
      ) : (
        <FlatList
          data={results as Toilet[]}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ToiletCard toilet={item} isOwn={item.userId === userId} />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            results ? (
              <Text style={styles.resultCount}>
                {results.length}件見つかりました
              </Text>
            ) : null
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
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  list: {
    paddingBottom: 24,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
});
