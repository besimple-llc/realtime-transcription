import type { User } from "@/server/domain/models/user/User";

export class RoomMembers {
  private readonly members: Set<string> = new Set();

  get isEmpty() {
    return this.members.size === 0;
  }

  get length() {
    return this.members.size;
  }

  get ids() {
    return [...this.members];
  }

  join(user: User) {
    this.members.add(user.id);
    return this.members.size;
  }

  leave(user: User) {
    this.members.delete(user.id);
    return this.members.size;
  }
}
