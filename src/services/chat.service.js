import Chat from "../models/user.chat.js";
import { emitEvent } from "../utils/features.js";
import { ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { CustomError } from "../error.js";
import User from "../models/user.Model.js";
const createGroupChat = async (name, GroupChat, creator, members, req) => {

  const usersPromises = members?.map((member) => User.findOne({ _id: member }));
  const users = await Promise.all(usersPromises);

  if (users.some(user => !user)) {
    throw new CustomError("One or more members do not exist", 400);
  }
  const Chats = await Chat.create({
    name,
    GroupChat,
    creator,
    members,
  });

  if (!Chats) {
    throw new CustomError("Failed to create group chat", 401);
  }

  emitEvent(req, ALERT, members, `Welcome to ${name} group`);
  emitEvent(req, REFETCH_CHATS, members);

  return Chats;
};


const getMyChats = async (user) => {
  if (!user || !user._id) return [];

  const chats = await Chat.find({ members: user._id }).populate({
    path: "members",
    select: "username avatar name",
  });

  if(!chats) {
    return CustomError("no chat found", 404);
  }

  const transformedChats = chats?.map((chat) => {
    const otherMember = getOtherMember(chat.members, user._id);

    return {
      _id: chat._id,
      groupChat: chat.GroupChat,
      username: chat.GroupChat ? chat.name : otherMember?.username || "Unknown",
      name: chat.GroupChat ? chat.name : otherMember?.name || "Unknown",
      avatar: chat.GroupChat
        ? chat.members
          .slice(0, 3)
          .map((member) => member?.avatar?.secure_url || "")
        : [otherMember?.avatar?.secure_url || ""],
      members: chat.members
        .filter((member) => String(member._id) !== String(user._id))
        .map((member) => member._id),
    };
  });

  return transformedChats;
};

const getMyGroups = async (user) => {
  
  const chats = await Chat.find({
    GroupChat: true,
    members: user._id, 
  }).populate({
    path: "members",
    select: "username avatar",
  });

  
  if (chats.length === 0) return []

  
  const groups = chats.map((chat) => ({
    _id: chat._id,
    groupChat: chat.GroupChat,
    name: chat.name,
    avatar: chat.members.map((member) => member.avatar?.secure_url || ""), 
  }));

  return groups;
};

export { createGroupChat, getMyChats, getMyGroups };
