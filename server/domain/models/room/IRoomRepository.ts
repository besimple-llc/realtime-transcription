import type { Room } from "@/server/domain/models/room/Room";
import type { RoomId } from "@/server/domain/models/room/RoomId";

export interface IRoomRepository {
  createRoom: (room: Room) => Promise<void>;
  listRooms: () => Promise<Room[]>;
  getRoom: (roomId: string) => Promise<Room | undefined>;
  setRoom: (room: Room) => Promise<void>;
  removeRoom: (roomId: string) => Promise<void>;
  allRoomIds: () => Promise<RoomId[]>;
}
