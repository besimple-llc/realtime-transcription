import {v7 as uuidv7} from 'uuid';

export const generateRoomId = () => {
  return `room-${uuidv7()}`
}
