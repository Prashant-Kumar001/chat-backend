import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import http from "http"; 
import { Server } from "socket.io";
import { randomUUID } from "crypto";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routers/auth.routes.js";
import userRoutes from "./src/routers/user.routes.js";
import chatRoutes from "./src/routers/chat.routes.js";
import adminRoutes from "./src/routers/admin.routes.js";

import {
  TYPING,
  STOP_TYPING,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
  CHAT_JOINED,
  CHAT_LEAVED,
  ONLINE_USER,
} from "./src/constants/events.js";

import logger from "./src/utils/logg.js";
import { getSocketId } from "./src/lib/helper.js";
import { socketAuthentication } from "./src/middleware/auth.Middleware.js";
import Message from "./src/models/user.message.js";

dotenv.config();
connectDB();
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: "Too many requests, please try again later.",
  headers: true,
});


const ids = new Map();
const onlineUsers = [];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});
app.set("io", io);

app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("src/public/uploads"));
app.use(limiter);


if (process.env.NODE_ENV === "production") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } })
  );
}


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/admin", adminRoutes);

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.response, async (error) => {
    await socketAuthentication(error, socket, next);
  });
});


io.on("connection", (socket) => {
  const user = socket?.user;
  ids.set(user._id.toString(), socket.id);

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      content: message,
      _id: randomUUID().toString(),
      sender: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar?.secure_url,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };
    const messageForDb = {
      content: message,
      sender: user._id,
      chat: chatId,
      attachments: [],
    };
    const membersSocket = getSocketId(members);
    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
    try {
      await Message.create(messageForDb);
    } catch (error) {
      throw new CustomError(error.message, 500);
    }
  });
  socket.on(TYPING, ({ chatId, members }) => {
    const membersSocket = getSocketId(members);
    socket.to(membersSocket).emit(TYPING, { chatId });
  });
  socket.on(STOP_TYPING, ({ chatId, members }) => {
    const membersSocket = getSocketId(members);
    socket.to(membersSocket).emit(STOP_TYPING, { chatId });
  });
  socket.on(REFETCH_CHATS, ({ chatId, members, name }) => {
    const userIds = members?.map((user) => user._id);
    const membersSocket = getSocketId(userIds);
    socket.to(membersSocket).emit(REFETCH_CHATS, { chatId, members, name });
  });
  socket.on(CHAT_JOINED, ({ user, members }) => {
    onlineUsers.push(user.toString());
    const membersSocket = getSocketId(members);
    io.to(membersSocket).emit(ONLINE_USER, onlineUsers);
  });
  socket.on(CHAT_LEAVED, ({ user, members }) => {
    onlineUsers.pop(user.toString());
    const membersSocket = getSocketId(members);
    io.to(membersSocket).emit(ONLINE_USER, onlineUsers);
  });
  socket.on("disconnect", () => {
    ids.delete(user._id.toString());
    onlineUsers.pop(user.toString());
    socket.broadcast.emit(ONLINE_USER, onlineUsers);
  });
});

app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message:
        "A chat with this name already exists. Please choose a different name.",
    });
  }
  return res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === "development" ? err.message : "Internal Server Error",
  });
});

process.on("SIGINT", async () => {
  logger.info("Shutting down server...");
  process.exit(0);
});

export { app, server, ids };
