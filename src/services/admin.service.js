import User from "../models/user.Model.js";
import Chat from "../models/user.chat.js";
import { CustomError } from "../error.js";
import Message from "../models/user.message.js";
import { generateToken } from "../utils/helper.js";

export const adminLogin = async (email, password) => {
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        throw new CustomError("Invalid credentials", 401);
    }
    const admin = {
        _id: user._id,
        admin: true,
        role: user.role,
    };
    const token = generateToken(admin);

    return { admin, token };
};

export const getAllUsers = async (page, limit) => {
    const [allUsers, total] = await Promise.all([
        User.find({})
            .sort({ createdAt: -1 })
            .lean(),
        User.countDocuments(),
    ]);

    if (allUsers.length === 0) {
        throw new CustomError("users not found", 404);
    }


    const transformedUsers = await Promise.all(
        allUsers.map(async ({ username, avatar, _id, name, role }) => {
            const groups = await Chat.countDocuments({
                members: _id,
                GroupChat: true,
            });
            const friends = await Chat.countDocuments({
                members: _id,
                GroupChat: false,
            });
            return {
                _id,
                name,
                username,
                avatar: avatar?.secure_url,
                groups: groups,
                friends: friends,
                role: role
            };
        })
    );

    return { allUsers: transformedUsers, total };
};

export const getAllChats = async (page, limit) => {
    const [allChats, total] = await Promise.all([
        Chat.find({})
            .sort({ createdAt: -1 })
            .lean()
            .populate({
                path: "creator",
                select: "username avatar",
            })
            .populate({
                path: "members",
                select: "username avatar",
            }),
        Chat.countDocuments(),
    ]);
    

    const transformChats = await Promise.all(
        allChats.map(async ({ _id, members, GroupChat, username, creator, name }) => {
            const totalMessages = await Message.countDocuments({ chat: _id });
            return {
                _id,
                username,
                name,
                GroupChat,
                creator,
                avatar: members.slice(0, 3).map(({ avatar }) => avatar?.secure_url),
                members: members.map((item) => {
                    return {
                        _id: item._id,
                        username: item.username,
                        avatar: item.avatar?.secure_url,
                    };
                }),
                creator: {
                    _id: creator?._id,
                    username: creator?.username,
                    avatar: creator?.avatar?.secure_url,
                },
                totalMembers: members.length,
                totalMessages,
            };
        })
    );

    if (allChats.length === 0) {
        throw new CustomError("Chats not found", 404);
    }

    return { allChats: transformChats, total };
};

export const getAllMessages = async (page, limit) => {
    const [allMessages, total] = await Promise.all([
        Message.find({})
            .sort({ createdAt: -1 })
            .lean()
            .populate("sender", "username avatar")
            .populate("chat"),
        Message.countDocuments(),
    ]);
    if (allMessages.length === 0) {
        throw new CustomError("there are no messages", 401);
    }

    const transformMessages = allMessages?.map((message) => {
        return {
            _id: message._id,
            sender: {
                _id: message.sender?._id,
                username: message.sender?.username,
                avatar: message.sender?.avatar?.secure_url,
            },
            chat: {
                _id: message.chat?._id,
                username: message.chat?.name,
                creator: message.chat?.creator,
                groupChat: message.chat?.GroupChat,
            },
            content: message.content,
            attachments: message.attachments ? message.attachments : [],
            createdAt: message.createdAt,
        };
    });
    return { transformMessages, total };
};
export const getDashBordData = async () => {
  

    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysMessages = await Message.find({
        createdAt: {
            $gte: last7Days,
            $lte: today,
        },
    }).select("createdAt");

    const messages = new Array(7).fill(0);
    const dayInMilliseconds = 1000 * 60 * 60 * 24;

    last7DaysMessages.forEach((message) => {
        const indexApprox =
            (today.getTime() - message.createdAt.getTime()) / dayInMilliseconds;
        const index = Math.floor(indexApprox);
        messages[6 - index]++;
    });

    const [
        groupChatsCount,
        personalChatsCount,
        totalMessages,
        totalUsers,
    ] = await Promise.all([
        Chat.countDocuments({ GroupChat: true }),
        Chat.countDocuments({ GroupChat: false }),
        Message.countDocuments(),
        User.countDocuments(),
    ]);

    const stats = {
        groupChatsCount,
        personalChatsCount,
        totalMessages,
        totalUsers,
        totalChats: groupChatsCount + personalChatsCount,
        messagesChart: messages,
    };

    return stats;
};
