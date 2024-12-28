import { v7 } from "uuid";

export class RoomId {
  private constructor(private readonly _value: string) {}

  static generate(): RoomId {
    return new RoomId(`room-${v7()}`);
  }

  static of(value: string): RoomId {
    return new RoomId(value);
  }

  value() {
    return this._value;
  }
}
