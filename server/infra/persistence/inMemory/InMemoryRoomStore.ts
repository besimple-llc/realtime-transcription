import type { IRoomRepository } from "@/server/domain/models/room/IRoomRepository";
import type { Room } from "@/server/domain/models/room/Room";
import { RoomId } from "@/server/domain/models/room/RoomId";

export class InMemoryRoomRepository implements IRoomRepository {
  private readonly _data: Map<string, Room> = new Map();

  createRoom(room: Room): Promise<void> {
    this._data.set(room.id, room);
    return Promise.resolve();
  }

  getRoom(roomId: string): Promise<Room | undefined> {
    return Promise.resolve(this._data.get(roomId));
  }

  removeRoom(roomId: string): Promise<void> {
    this._data.delete(roomId);
    return Promise.resolve();
  }

  setRoom(room: Room): Promise<void> {
    this._data.set(room.id, room);
    return Promise.resolve();
  }

  allRoomIds(): Promise<RoomId[]> {
    const roomIds: RoomId[] = [];
    for (const roomId of this._data.keys()) {
      roomIds.push(RoomId.of(roomId));
    }
    return Promise.resolve(roomIds);
  }

  listRooms(): Promise<Room[]> {
    const rooms: Room[] = [];
    for (const room of this._data.values()) {
      rooms.push(room);
    }
    return Promise.resolve(rooms);
  }
}
