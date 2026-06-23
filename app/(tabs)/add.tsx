import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { usePostHog } from "posthog-react-native";
import { api } from "../../convex/_generated/api";
import { ToiletType } from "../../types";
import { TOILET_TYPES, TOILET_TYPE_LABELS, TOILET_TYPE_ICONS } from "../../constants/ToiletTypes";
import { useLocation } from "../../hooks/useLocation";
import Colors from "../../constants/Colors";
import { useRouter } from "expo-router";
import { Id } from "../../convex/_generated/dataModel";

export default function AddScreen() {
  const { userId } = useAuth();
  const posthog = usePostHog();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const { region, location, getCurrentLocation } = useLocation();

  const [name, setName] = useState("");
  const [type, setType] = useState<ToiletType>("western");
  const [notes, setNotes] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createToilet = useMutation(api.toilets.createToilet);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const handleMapPress = (e: any) => {
    const { coordinate } = e.nativeEvent;
    setSelectedLocation(coordinate);
  };

  const handleUseCurrentLocation = async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setSelectedLocation(coords);
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 },
        500
      );
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("エラー", "写真ライブラリへのアクセスを許可してください");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("エラー", "カメラへのアクセスを許可してください");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<Id<"_storage"> | undefined> => {
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/jpeg" },
        body: blob,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");
      const { storageId } = await uploadResponse.json();
      return storageId as Id<"_storage">;
    } catch {
      return undefined;
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;
    if (!name.trim()) {
      Alert.alert("エラー", "トイレの名前を入力してください");
      return;
    }
    if (!selectedLocation) {
      Alert.alert("エラー", "地図をタップして場所を選んでください");
      return;
    }

    setLoading(true);
    try {
      let imageStorageId: Id<"_storage"> | undefined;
      if (imageUri) {
        imageStorageId = await uploadImage(imageUri);
      }

      await createToilet({
        clerkId: userId,
        name: name.trim(),
        type,
        notes: notes.trim() || undefined,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        imageStorageId,
      });

      posthog?.capture("toilet_registered", {
        type,
        has_image: !!imageStorageId,
        has_notes: !!notes.trim(),
      });

      Alert.alert("登録完了", "トイレを登録しました！", [
        {
          text: "OK",
          onPress: () => {
            setName("");
            setNotes("");
            setSelectedLocation(null);
            setImageUri(null);
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert("エラー", err.message || "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Map picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 場所を選択</Text>
        <Text style={styles.sectionHint}>
          地図をタップして場所を指定してください
        </Text>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onPress={handleMapPress}
            showsUserLocation
          >
            {selectedLocation && (
              <Marker coordinate={selectedLocation} title="登録予定地" />
            )}
          </MapView>
          {selectedLocation && (
            <View style={styles.coordBadge}>
              <Text style={styles.coordText}>
                {selectedLocation.latitude.toFixed(5)},{" "}
                {selectedLocation.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.currentLocBtn}
          onPress={handleUseCurrentLocation}
        >
          <Text style={styles.currentLocBtnText}>📍 現在地を使用</Text>
        </TouchableOpacity>
      </View>

      {/* Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚽 トイレ情報</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>名前 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="例：渋谷駅公衆トイレ"
            placeholderTextColor={Colors.textLight}
            maxLength={50}
          />
        </View>

        {/* Type picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>種類 *</Text>
          <View style={styles.typeGrid}>
            {TOILET_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                onPress={() => setType(t)}
              >
                <Text style={styles.typeIcon}>{TOILET_TYPE_ICONS[t]}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    type === t && styles.typeLabelActive,
                  ]}
                >
                  {TOILET_TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>メモ（任意）</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="清潔さ、設備など自由にメモ..."
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>
      </View>

      {/* Photo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📷 写真（任意）</Text>
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.removeImageBtnText}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickImage}>
              <Text style={styles.photoBtnIcon}>🖼️</Text>
              <Text style={styles.photoBtnText}>ライブラリ</Text>
            </TouchableOpacity>
            {Platform.OS !== "web" && (
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={handleTakePhoto}
              >
                <Text style={styles.photoBtnIcon}>📷</Text>
                <Text style={styles.photoBtnText}>カメラ</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>🚽 トイレを登録する</Text>
        )}
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
  section: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  coordBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  coordText: {
    color: "#fff",
    fontSize: 11,
  },
  currentLocBtn: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  currentLocBtnText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  typeIcon: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  typeLabelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    gap: 6,
  },
  photoBtnIcon: {
    fontSize: 28,
  },
  photoBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
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
