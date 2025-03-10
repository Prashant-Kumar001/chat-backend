import mongoose, { Types } from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: {
        caseSensitive: false,
        index: true,
        message: ""
      },
      trim: true,
    },
    GroupChat: {
      type: Boolean,
      default: false,
      required: true,
    },
    creator: {
      type: Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);


const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
