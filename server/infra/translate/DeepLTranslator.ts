import type { ITranslator } from "@/server/domain/models/translator/ITranslator";
import type { Language } from "@/types/Language";
import type { TargetLanguageCode } from "deepl-node";
import * as deepl from "deepl-node";
import type { SourceLanguageCode } from "deepl-node/dist/types";

export class DeepLTranslator implements ITranslator {
  private deepL: deepl.Translator;

  constructor() {
    if (!process.env.DEEPL_API_KEY) {
      throw new Error("Please set DEEPL_API_KEY.");
    }
    this.deepL = new deepl.Translator(process.env.DEEPL_API_KEY);
  }

  async translate(text: string, from: Language, to: Language): Promise<string> {
    const translationResult = await this.deepL.translateText(
      text,
      this.changeSourceLanguageCode(from),
      this.changeTargetLanguageCode(to),
    );
    return translationResult.text;
  }

  private changeTargetLanguageCode(targetLanguage: Language): TargetLanguageCode {
    if (targetLanguage === "en") {
      return "en-US";
    }
    if (targetLanguage === "ja") {
      return "ja";
    }
    throw new Error("Invalid targetLanguage");
  }

  private changeSourceLanguageCode(sourceLanguage: Language): SourceLanguageCode {
    if (sourceLanguage === "en") {
      return "en";
    }
    if (sourceLanguage === "ja") {
      return "ja";
    }
    throw new Error("Invalid sourceLanguage");
  }
}
