import { ToiletFacilities, CongestionLevel } from "../types";

export const FACILITY_LABELS: Record<keyof ToiletFacilities, string> = {
  multipurpose: "多目的トイレ",
  diaperChanging: "おむつ交換台",
  washlet: "ウォシュレット",
  ostomate: "オストメイト対応",
  separateByGender: "男女別",
  babyChair: "ベビーチェア",
  kidsToilet: "子ども用便座",
};

export const FACILITY_ICONS: Record<keyof ToiletFacilities, string> = {
  multipurpose: "♿",
  diaperChanging: "🚼",
  washlet: "🚿",
  ostomate: "🏥",
  separateByGender: "🚻",
  babyChair: "🪑",
  kidsToilet: "🧒",
};

export const FACILITY_KEYS: (keyof ToiletFacilities)[] = [
  "multipurpose",
  "diaperChanging",
  "washlet",
  "ostomate",
  "separateByGender",
  "babyChair",
  "kidsToilet",
];

export const REGISTERABLE_FACILITY_KEYS: (keyof ToiletFacilities)[] = [
  "multipurpose",
  "diaperChanging",
  "washlet",
  "ostomate",
];

export const CONGESTION_LABELS: Record<CongestionLevel, string> = {
  empty: "空いている",
  normal: "やや混雑",
  crowded: "混雑",
  very_crowded: "満員",
};

export const CONGESTION_ICONS: Record<CongestionLevel, string> = {
  empty: "😀",
  normal: "🙂",
  crowded: "😐",
  very_crowded: "😣",
};

export const CONGESTION_LEVELS: CongestionLevel[] = [
  "empty",
  "normal",
  "crowded",
  "very_crowded",
];

export const FEE_LABELS = {
  free: "無料",
  paid: "有料",
  unknown: "不明",
} as const;

export const HOURS_LABELS = {
  "24h": "24時間利用可",
  custom: "営業時間あり",
  unknown: "不明",
} as const;
