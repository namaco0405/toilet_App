import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Stack } from "expo-router";
import Colors from "../constants/Colors";

const FAQ_ITEMS: [string, string][] = [
  ["トイレMAPは無料で使えますか？", "はい、検索・登録・報告を含め、すべての機能を無料でご利用いただけます。"],
  ["掲載されている情報は正確ですか？", "情報はユーザーの登録・報告をもとに掲載しています。最終確認日時を目安に、最新の状況と異なる場合がある点をご了承ください。"],
  ["誰でもトイレを登録できますか？", "はい、アカウントをお持ちの方ならどなたでも新しいトイレを登録できます。"],
  ["店舗内のトイレも掲載されますか？", "店舗内のトイレも登録可能です。利用条件（顧客専用など）はメモ欄をご確認ください。"],
  ["多目的トイレだけを検索できますか？", "はい、絞り込み検索の「設備」から多目的トイレなど条件を指定して検索できます。"],
  ["投稿した情報を修正できますか？", "マイページの「自分が登録したトイレ」から、登録したトイレの削除ができます。修正機能は今後追加予定です。"],
  ["対応地域はどこですか？", "地域の制限はなく、全国どこでも検索・登録が可能です。"],
  ["個人情報はどのように扱われますか？", "登録いただいた氏名・メールアドレスはアカウント管理にのみ利用し、第三者に提供することはありません。"],
];

export default function FaqScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <Stack.Screen options={{ title: "よくある質問" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {FAQ_ITEMS.map(([question, answer], i) => {
          const open = openIndex === i;
          return (
            <TouchableOpacity
              key={question}
              style={styles.item}
              onPress={() => setOpenIndex(open ? null : i)}
              activeOpacity={0.7}
            >
              <View style={styles.questionRow}>
                <Text style={styles.question}>{question}</Text>
                <Text style={styles.chevron}>{open ? "︿" : "﹀"}</Text>
              </View>
              {open && <Text style={styles.answer}>{answer}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  item: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  question: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  chevron: {
    fontSize: 14,
    color: Colors.textLight,
  },
  answer: {
    marginTop: 10,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
