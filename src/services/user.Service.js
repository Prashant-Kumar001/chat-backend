import User from "../models/user.Model.js";
import { CustomError } from "../error.js";
import mongoose from "mongoose";
import Request from "../models/user.request.js";
import Chat from "../models/user.chat.js";
import { getOtherMember } from "../lib/helper.js";
import bcrypt from "bcryptjs";

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password"); 
  if (!user) {
    throw CustomError("User not found", 404);
  }
  return user;
};

export const updateUser = async (userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new CustomError("Invalid user ID format", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError("User not found", 404);
  }

  const updatedFields = {}; 

  
  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(updateData.password, salt);
    updatedFields.password = "Password has been updated"; 
  }

  
  await User.findByIdAndUpdate(userId, { $set: updateData }, {
    new: true,
    runValidators: true,
  });

  
  for (const key in updateData) {
    if (key !== "password") {
      updatedFields[key] = updateData[key];
    }
  }

  return updatedFields; 
};

export const deleteUser = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new CustomError("Invalid user ID format", 400);
  }

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  return { message: "User deleted successfully" };
};

export const searchUsers = async (name, me) => {
  if (!name) {
    const [users, friends] = await Promise.all([
      User.find({
        _id: { $ne: me },
      }),
      Chat.find({
        members: { $all: [me] },
        GroupChat: false,
      }),
    ]);

    const filteredUsers = users.filter((user) => {
      return !friends.some((friend) => friend.members.includes(user._id));
    });

    return filteredUsers;
  }
  const users = await User.find({ username: { $regex: name, $options: "i" } });
  if (users.length === 0) {
    throw new CustomError(`User ${name} not found`, 404);
  }
  const friends = await Chat.find({
    members: { $all: [me] },
    GroupChat: false,
  });
  const filteredUsers = users.filter((user) => {
    return !friends.some((friend) => friend.members.includes(user._id));
  });
  return filteredUsers;
};

export const sendFriendRequest = async (sender, receiver) => {
  const user = await User.findById(sender);
  if (!user) {
    throw new CustomError("User not found", 404);
  }
  if (user._id.equals(receiver)) {
    throw new CustomError("You cannot send a friend request to yourself", 400);
  }
  const reqPending = await Request.findOne({
    $or: [
      { sender: sender, receiver: receiver },
      { sender: receiver, receiver: sender },
    ],
    status: "pending",
  });
  if (reqPending) {
    throw new CustomError("already sent a friend request", 400);
  }

  const alreadyFriend = await Chat.findOne({
    members: { $all: [sender, receiver] },
    GroupChat: false,
  });
  if (alreadyFriend) {
    throw new CustomError("You are already friends", 400);
  }

  const request = await Request.create({
    sender: sender,
    receiver: receiver,
    status: "pending",
  });
  if (!request) {
    throw new CustomError("Failed to send friend request", 500);
  }

  return request;
};

export const acceptFriendRequest = async (requestId, status, me) => {
  const request = await Request.findById(requestId)
    .populate({
      path: "sender",
      select: "username avatar",
    })
    .populate({
      path: "receiver",
      select: "username avatar",
    });
  if (!request) {
    throw new CustomError("Friend request not found", 404);
  }
  if (me._id.toString() !== request.receiver?._id.toString()) {
    throw new CustomError("You are not the receiver of this request", 403);
  }

  if (request.status !== "pending") {
    throw new CustomError("Friend request is not pending", 400);
  }

  if (status === "rejected") {
    await Request.findByIdAndDelete(requestId);
    throw new CustomError("Friend request rejected", 200);
  }

  if (status === "accepted") {
    const [newChat, deleteRequest] = await Promise.all([
      Chat.create({
        name: `${request.sender?.username}-${request.receiver?.username}`,
        members: [request.sender?.id, request.receiver?.id],
        GroupChat: false,
      }),
      Request.findByIdAndDelete(requestId),
    ]);

    return  newChat ;
  }
};

export const getMyNotifications = async (userId) => {
  const notifications = await Request.find({
    receiver: userId,
    status: "pending",
  })
    .populate({
      path: "sender",
      select: "username avatar",
    })
    .sort({ createdAt: -1 });
  if (notifications.length === 0) {
    throw new CustomError("No notifications found", 200);
  }
  return notifications;
};

export const getMyFriends = async (userId, chatId) => {
  const Chats = await Chat.find({ members: userId, GroupChat: false }).populate(
    {
      path: "members",
      select: "-password",
    }
  );
  if (Chats.length === 0) {
    throw new CustomError("No friends found", 200);
  }
  const friends = Chats?.map((item) => {
    const otherMember = getOtherMember(item?.members, userId);
    return {
      _id: otherMember?._id,
      username: otherMember?.username,
      avatar: otherMember?.avatar,
    };
  });

  if (chatId) {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new CustomError("Chat not found", 404);
    }
    const availableFiends = friends.filter(
      (friend) =>
        chat.members.filter(
          (member) => member.toString() === friend._id.toString()
        ).length > 0
    );
    return availableFiends;
  } else {
    return friends;
  }
};
