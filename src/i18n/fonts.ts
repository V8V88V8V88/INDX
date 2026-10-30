import {
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Oriya,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
} from "next/font/google";
import type { Locale } from "./routing";

const devanagari = Noto_Sans_Devanagari({ variable: "--font-script", subsets: ["devanagari"], display: "swap", preload: false });
const bengali = Noto_Sans_Bengali({ variable: "--font-script", subsets: ["bengali"], display: "swap", preload: false });
const telugu = Noto_Sans_Telugu({ variable: "--font-script", subsets: ["telugu"], display: "swap", preload: false });
const tamil = Noto_Sans_Tamil({ variable: "--font-script", subsets: ["tamil"], display: "swap", preload: false });
const gujarati = Noto_Sans_Gujarati({ variable: "--font-script", subsets: ["gujarati"], display: "swap", preload: false });
const kannada = Noto_Sans_Kannada({ variable: "--font-script", subsets: ["kannada"], display: "swap", preload: false });
const malayalam = Noto_Sans_Malayalam({ variable: "--font-script", subsets: ["malayalam"], display: "swap", preload: false });
const oriya = Noto_Sans_Oriya({ variable: "--font-script", subsets: ["oriya"], display: "swap", preload: false });
const gurmukhi = Noto_Sans_Gurmukhi({ variable: "--font-script", subsets: ["gurmukhi"], display: "swap", preload: false });

export const scriptFonts: Partial<Record<Locale, { variable: string }>> = {
  hi: devanagari,
  bn: bengali,
  mr: devanagari,
  te: telugu,
  ta: tamil,
  gu: gujarati,
  kn: kannada,
  ml: malayalam,
  or: oriya,
  pa: gurmukhi,
};
