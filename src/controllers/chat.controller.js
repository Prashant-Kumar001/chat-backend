import asyncHandler from "express-async-handler";
import ResponseHandler from "../utils/responseHandler.js";
import {
    createGroupChat,
    getMyChats,
    getMyGroups,
} from "../services/chat.service.js";
import { CustomError } from "../error.js";
import Chat from "../models/user.chat.js";
import User from "../models/user.Model.js";
import Message from "../models/user.message.js";
import { emitEvent, deleteFileFromCloudinary } from "../utils/features.js";
import {
    ALERT,
    NEW_MESSAGE_ALERT,
    NEW_ATTACHMENT,
    NEW_MESSAGE,
    REFETCH_CHATS,
} from "../constants/events.js";
import statusCodes from "../utils/statusCodes.js";
import mongoose from "mongoose";
import { uploadFilesToCloudinary } from "../utils/Cloudinary.js";
import { randomUUID } from "crypto";

const newGroupChat = asyncHandler(async (req, res) => {
    const { name, members } = req.body;

    const allMembers = [...members, req.user._id];
    const groupChat = await createGroupChat(
        name,
        true,
        req.user._id,
        allMembers,
        req
    );

    return ResponseHandler.success(
        res,
        200,
        "Group chat created successfully",
        groupChat
    );
});

const getUserChats = asyncHandler(async (req, res) => {
    const userChats = await getMyChats(req.user);
    return ResponseHandler.success(
        res,
        200,
        "User chats fetched successfully",
        userChats
    );
});

const getUserGroups = asyncHandler(async (req, res) => {
    const userGroups = await getMyGroups(req.user);

    if (userGroups.length > 0) {
        return res.status(200).json({
            success: true,
            message: "you are not added to any group ! make your first new group😊😊",
            data: userGroups
        });
    }

    return ResponseHandler.success(
        res,
        200,
        "User groups fetched successfully",
        userGroups
    );
});

const addMembers = asyncHandler(async (req, res) => {
    const { chatId, members } = req.body;

    const chat = await Chat.findOne({
        _id: chatId,
    });

    if (!chat) {
        return ResponseHandler.error(res, 404, "Chat not found");
    }
    if (!chat.GroupChat) {
        return ResponseHandler.error(res, 404, "this is not group chat");
    }
    if (chat.creator.toString() !== req.user._id.toString()) {
        return ResponseHandler.error(
            res,
            403,
            "You are not allowed to add members to this chat"
        );
    }



    const isAddUser = members.map(member => ({
        _id: member,
        alreadyInChat: chat?.members?.some(id => id.toString() === member.toString())
    }));

    isAddUser.forEach(member => {
        if (member.alreadyInChat) {
            throw new CustomError("some members are already in the chat please remove those members", statusCodes.CONFLICT)
        }
    })


    const allNewMembersPromise = members.map((member) =>
        User.findById(member, "username")
    );
    const allNewMembers = await Promise.all(allNewMembersPromise);

    const newMembers = allNewMembers.map((member) => member._id.toString());
    const oldMembers = chat.members.map((member) => member._id.toString());
    const allMembers = [...new Set([...oldMembers, ...newMembers])];

    chat.members = allMembers;

    if (chat.members.length > 100) {
        return ResponseHandler.error(
            res,
            400,
            "Chat can't have more than 100 members"
        );
    }

    await chat.save();

    const allMembersNames = allNewMembers
        .map((member) => member.username)
        .join(", ");

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${allMembersNames} has been added to ${chat.name} group`
    );
    const realTimeMembers = [...chat.members, ...members]
    emitEvent(req, REFETCH_CHATS, realTimeMembers);

    return ResponseHandler.success(res, 200, "Members added successfully", chat);
});

const removeMembers = asyncHandler(async (req, res) => {
    const { userId, chatId } = req.body;


    const chat = await Chat.findById(chatId);
    if (!chat) return ResponseHandler.error(res, 404, "Chat not found");


    if (!chat.GroupChat) return ResponseHandler.error(res, 400, "This is not a group chat");


    if (!chat.creator.equals(req.user._id)) {
        return ResponseHandler.error(res, 403, "only admin can delete members!");
    }


    if (chat.creator.equals(userId)) {
        return ResponseHandler.error(res, 400, "The creator of the chat cannot remove themselves. Please transfer ownership or delete the chat instead.");
    }


    const user = await User.findById(userId).lean();
    if (!user) return ResponseHandler.error(res, 404, "User not found");


    if (!chat.members.some(memberId => memberId.equals(userId))) {
        return ResponseHandler.error(res, 404, "User not found in the chat");
    }


    if (chat.members.length <= 3) {
        return ResponseHandler.error(res, 400, "Chat must have at least 3 members");
    }


    chat.members.pull(userId);
    await chat.save();

    const realTimeMembers = [...chat.members, userId]
    emitEvent(req, REFETCH_CHATS, realTimeMembers);
    emitEvent(req, ALERT, realTimeMembers, `${user.username} has been removed from ${chat.name} group`);

    return ResponseHandler.success(res, 200, "Member removed successfully", chat);
});

const leaveGroup = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        return ResponseHandler.error(res, 404, "Chat not found");
    }
    if (!chat.GroupChat) {
        return ResponseHandler.error(res, 404, "This is not group chat");
    }
    const isGroupMember = chat.members.find(
        (member) => member.toString() === req.user?._id.toString()
    );
    if (!isGroupMember) {
        return ResponseHandler.error(
            res,
            403,
            "You are not member of this group maybe you have left the group or admin removed you!"
        );
    }
    const remainingMembers = chat?.members?.filter(
        (memberId) => memberId.toString() !== req.user?._id.toString()
    );

    if (remainingMembers.length < 3) {
        return ResponseHandler.error(res, 400, "Chat must have at least 3 members");
    }

    if (chat?.creator.toString() === req.user?._id.toString()) {
        // const randomNumber = Math.floor(Math.random() * remainingMembers.length);
        // const newCreator = remainingMembers[randomNumber];
        // chat.creator = newCreator;

        return ResponseHandler.error(res, 400, "Creator can't leave the group! if you want then transfer the ownership first");
    }

    chat.members = remainingMembers;

    const [user] = await Promise.all([
        User.findById(req.user?._id).select("username"),
        chat.save(),
    ]);

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${user.username} has left ${chat.name} group`
    );
    emitEvent(req, REFETCH_CHATS, chat.members);
    return ResponseHandler.success(res, 200, "Member removed successfully", chat);
});

const sendAttachment = asyncHandler(async (req, res) => {
    const { chatId } = req.body;

    const [chats, me] = await Promise.all([
        Chat.findById(chatId),
        User.findById(req.user?._id),
    ]);

    const files = req.files || [];

    if (files.length === 0) {
        return ResponseHandler.error(res, 400, "No files uploaded");
    }
    if (files.length >= 5) {
        return ResponseHandler.error(res, 400, "only 5 files can be uploaded at a time");
    }

    if (!chats) {
        return ResponseHandler.error(res, 400, "Chat not found");
    }

    if (!me) {
        return ResponseHandler.error(res, 400, "User not found");
    }

    const attachments = await uploadFilesToCloudinary(files);

    const messageForDb = {
        content: "",
        sender: me._id,
        chat: chatId,
        attachments,
    };

    const messages = await Message.create(messageForDb);

    const messageForRealTime = {
        ...messageForDb,
        content: null,
        _id: randomUUID().toString(),
        sender: {
            _id: me._id,
            username: me.username,
        },
        createdAt: new Date().toISOString(),
    };

    emitEvent(req, NEW_MESSAGE, chats.members, {
        chatId,
        message: messageForRealTime,
    });
    emitEvent(req, NEW_MESSAGE_ALERT, chats.members, { ChatId: chatId });

    return ResponseHandler.success(
        res,
        200,
        "Attachment sent successfully",
        messages
    );
});

const getChatDetails = asyncHandler(async (req, res) => {
    if (req.query.populate === "true") {
        const chats = await Chat.findById(req.params.chatId)
            .populate({
                path: "members",
                select: "username avatar",
            })
            .lean();
        if (!chats) {
            return ResponseHandler.error(res, 404, "Chat not found");
        }

        chats.members = chats?.members?.map(({ _id, username, avatar }) => {
            return {
                _id,
                username,
                avatar: avatar,
            };
        });
        return ResponseHandler.success(res, 200, "Chat founds", chats);
    } else {
        const chats = await Chat.findById(req.params.chatId);
        if (!chats) {
            return ResponseHandler.error(res, 404, "Chat not found add chatId");
        }
        return ResponseHandler.success(res, 200, "Chat founds", chats);
    }
});

const renameGroup = asyncHandler(async (req, res) => {
    const { newGroupName } = req.body;
    const { id } = req.params;
    const chat = await Chat.findById(id);
    if (!chat) {
        return ResponseHandler.error(res, 404, "Chat not found");
    }
    if (!chat.GroupChat) {
        return ResponseHandler.error(res, 404, "This is not group chat");
    }

    if (chat.creator.toString() !== req.user._id.toString()) {
        return ResponseHandler.error(
            res,
            403,
            "You are not allowed to rename this chat"
        );
    }
    chat.name = newGroupName;
    await chat.save();
    emitEvent(req, REFETCH_CHATS, chat.members);
    return ResponseHandler.success(res, 200, "group renamed successfully", chat);
});

const deleteChat = asyncHandler(async (req, res) => {
    const { chatId: id } = req.params;

    const chat = await Chat.findById(id);
    if (!chat) {
        return ResponseHandler.error(res, 404, "Chat not found");
    }

    if (chat.GroupChat && chat.creator.toString() !== req.user._id.toString()) {
        return ResponseHandler.error(
            res,
            403,
            "You are not allowed to delete this chat! don`t repeat it, this can be done by admin "
        );
    }
    if (!chat.members.includes(req.user?._id) && !chat.GroupChat) {
        return ResponseHandler.error(res, 403, "You are not a member of this chat");
    }
    const members = chat?.members;
    const messageWithAttachments = await Message.find({
        chat: id,
        attachments: { $exists: true, $ne: [] },
    });

    const public_ids = [];
    messageWithAttachments.forEach((message) => {
        message.attachments.forEach((attachments) => {
            public_ids.push(attachments.public_id);
        });
    });

    await Promise.all([
        deleteFileFromCloudinary(public_ids),
        Message.deleteMany({ chat: id }),
        Chat.findByIdAndDelete(id),
    ]);
    emitEvent(req, REFETCH_CHATS, members);
    return ResponseHandler.success(res, 200, "group deleted successfully");
});

const getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return ResponseHandler.error(res, 400, "Invalid chat id");
    }

    if (!objectIdValidation(id)) {
        return ResponseHandler.error(res, 400, "Invalid chat id");
    }


    const chat = await Chat.findById(id);
    if (!chat) {
        return ResponseHandler.error(res, 404, "Chat not found");
    }


    if (!chat?.members?.includes(req.user?._id)) {
        return ResponseHandler.error(res, 403, "You are not a member of this chat");
    }


    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const [messages, totalMessages] = await Promise.all([
        Message.find({ chat: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("sender", "name email avatar")
            .lean(),
        Message.countDocuments({ chat: id }),
    ]);

    const metaData = {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        hasNextPage: page * limit < totalMessages,
        hasPreviousPage: page > 1,
        nextPage: page * limit < totalMessages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
    };

    const totalPages = Math.ceil(totalMessages / limit);

    return ResponseHandler.success(
        res,
        200,
        "messages fetched successfully",
        { messages: messages.reverse(), totalPages },
        metaData

    );
});

const objectIdValidation = (value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return false;
    }
    return true;
};

export {
    newGroupChat,
    getUserChats,
    getUserGroups,
    addMembers,
    removeMembers,
    leaveGroup,
    sendAttachment,
    getChatDetails,
    renameGroup,
    deleteChat,
    getMessages,
};
