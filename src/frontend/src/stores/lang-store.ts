import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "te";

interface LangState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
    }),
    { name: "medalert-lang" },
  ),
);
