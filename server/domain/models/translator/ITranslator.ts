import type { Language } from "@/types/Language";

export interface ITranslator {
  translate: (text: string, from: Language, to: Language) => Promise<string>;
}
