import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { Region } from "../types";

const DEFAULT_REGION: Region = {
  latitude: 35.6762,
  longitude: 139.6503,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export function useLocation() {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("位置情報へのアクセスが拒否されました");
        setLoading(false);
        return false;
      }
      setPermissionGranted(true);
      return true;
    } catch (e) {
      setErrorMsg("位置情報の取得に失敗しました");
      setLoading(false);
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      const granted = permissionGranted || (await requestPermission());
      if (!granted) return null;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc);
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      return loc;
    } catch (e) {
      setErrorMsg("現在地の取得に失敗しました");
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissionGranted, requestPermission]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
        await getCurrentLocation();
      }
    })();
  }, []);

  return {
    location,
    region,
    setRegion,
    errorMsg,
    loading,
    permissionGranted,
    getCurrentLocation,
    requestPermission,
  };
}
