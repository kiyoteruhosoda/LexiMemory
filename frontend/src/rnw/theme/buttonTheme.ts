// frontend/src/rnw/theme/buttonTheme.ts

import { colors, type RnwButtonKind, type RnwButtonTone } from "./tokens";

export type ButtonPalette = {
  bg: string;
  border: string;
  text: string;

  /** pressed state（kind問わず必ず持つ） */
  pressedBg: string;
  pressedBorder: string;
  pressedText: string;

  /** solid のみ軽く沈めたい等に使う（outlineは通常1） */
  pressedOpacity: number;
};

export type ButtonTheme = Record<
  RnwButtonTone,
  Record<RnwButtonKind, ButtonPalette>
>;

export const buttonTheme = {
  primary: {
    solid: {
      bg: colors.primary,
      border: colors.primary,
      text: colors.white,
      pressedBg: colors.primary,
      pressedBorder: colors.primary,
      pressedText: colors.white,
      pressedOpacity: 0.9,
    },
    outline: {
      bg: colors.transparent,
      border: colors.primary,
      text: colors.primary,
      pressedBg: colors.primary,
      pressedBorder: colors.primary,
      pressedText: colors.white,
      pressedOpacity: 1,
    },
  },

  secondary: {
    solid: {
      bg: colors.secondary,
      border: colors.secondary,
      text: colors.white,
      pressedBg: colors.secondary,
      pressedBorder: colors.secondary,
      pressedText: colors.white,
      pressedOpacity: 0.9,
    },
    outline: {
      bg: colors.transparent,
      border: colors.secondary,
      text: colors.secondary,
      pressedBg: colors.secondary,
      pressedBorder: colors.secondary,
      pressedText: colors.white,
      pressedOpacity: 1,
    },
  },

  success: {
    solid: {
      bg: colors.success,
      border: colors.success,
      text: colors.white,
      pressedBg: colors.success,
      pressedBorder: colors.success,
      pressedText: colors.white,
      pressedOpacity: 0.9,
    },
    outline: {
      bg: colors.transparent,
      border: colors.success,
      text: colors.success,
      pressedBg: colors.success,
      pressedBorder: colors.success,
      pressedText: colors.white,
      pressedOpacity: 1,
    },
  },

  danger: {
    solid: {
      bg: colors.danger,
      border: colors.danger,
      text: colors.white,
      pressedBg: colors.danger,
      pressedBorder: colors.danger,
      pressedText: colors.white,
      pressedOpacity: 0.9,
    },
    outline: {
      bg: colors.transparent,
      border: colors.danger,
      text: colors.danger,
      pressedBg: colors.danger,
      pressedBorder: colors.danger,
      pressedText: colors.white,
      pressedOpacity: 1,
    },
  },

  warning: {
    solid: {
      bg: colors.warning,
      border: colors.warning,
      text: colors.darkText,
      pressedBg: colors.warning,
      pressedBorder: colors.warning,
      pressedText: colors.darkText,
      pressedOpacity: 0.9,
    },
    outline: {
      bg: colors.transparent,
      border: colors.warning,
      text: colors.warning,
      pressedBg: colors.warning,
      pressedBorder: colors.warning,
      pressedText: colors.darkText,
      pressedOpacity: 1,
    },
  },

  light: {
    solid: {
      bg: colors.light,
      border: colors.lightBorder, // ← 境界を出す
      text: colors.darkText,

      // light は押下時だけ少し暗く
      pressedBg: colors.lightPressed,
      pressedBorder: colors.lightBorder,
      pressedText: colors.darkText,

      pressedOpacity: 1,
    },
    outline: {
      bg: colors.transparent,
      border: colors.lightBorder,
      text: colors.darkText,

      pressedBg: colors.lightPressed,
      pressedBorder: colors.lightBorder,
      pressedText: colors.darkText,

      pressedOpacity: 1,
    },
  },
} as const;