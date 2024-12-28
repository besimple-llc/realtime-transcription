import type { Language } from "@/types/Language";
import { v7 } from "uuid";

export class RoomId {
  private constructor(private readonly _value: string) {}

  static ja() {
    return RoomId.from("ja");
  }

  static en() {
    return RoomId.from("en");
  }

  static from(language: Language) {
    const id = `${language}-room-${v7()}`;
    return new RoomId(id);
  }

  static of(value: string): RoomId {
    const language = value.split("-")[0];
    if (language === "ja" || language === "en") {
      return new RoomId(value);
    }
    throw new Error("invalid room id");
  }

  value() {
    return this._value;
  }

  language() {
    return this.value().split("-")[0] as Language;
  }
}
