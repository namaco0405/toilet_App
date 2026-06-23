import { ToiletType } from "../types";

export const TOILET_TYPE_LABELS: Record<ToiletType, string> = {
  japanese: "和式",
  western: "洋式",
  multipurpose: "多目的",
  other: "その他",
};

export const TOILET_TYPE_ICONS: Record<ToiletType, string> = {
  japanese: "🚽",
  western: "🪑",
  multipurpose: "♿",
  other: "🚻",
};

export const TOILET_TYPES: ToiletType[] = [
  "japanese",
  "western",
  "multipurpose",
  "other",
];
