import mongoose, { Schema } from "mongoose";
import { type } from "os";

// TODO: Add image and pdf file sharing in the next version
const chatMessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
    },
    attachments: {
       type:[
        {
          public_id:{
            type: String,
          },
          url:{
            type: String,
          },
          type: {
            type: String
          },
          size: {
            type: Number,
          },
        },
      ],
      default: [],
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
    },
    status: { 
      type: String, 
      enum: ['pending','sent','delivered','read','rejected'], 
      default: 'pending'
    },
    readBy:
      {
        type: [Schema.Types.ObjectId],
        ref: "User"
      }
    
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
