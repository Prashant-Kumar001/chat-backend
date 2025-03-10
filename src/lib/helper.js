import { ids } from "../../app.js";

export const getOtherMember = (members, userId) => {
  return members?.find((member) => member?._id.toString() !== userId.toString());
};

export const getSocketId = (user) => {
  const sockets = user?.map((member) => ids.get(member.toString()));
  return sockets;
};
