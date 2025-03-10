import mongoose, { Types } from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        content: {
            type: String,
        },
        sender: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },
        chat: {
            type: Types.ObjectId,
            ref: "Chat",
            required: true,
        },
        attachments: [
            {
                public_id: {
                    type: String,
                    required: true
                },
                secure_url: {
                    type: String,
                    required: true
                }
            }
        ],
    },
    { timestamps: true }
);


const Message = mongoose.model("Message", messageSchema);

export default Message;
