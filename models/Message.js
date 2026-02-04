import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    ticketId: String,
    senderId: String,
    senderName: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    attachments: [
      {
        filename: String,
        size: Number,
        mimetype: String,
        filepath: String, // URL path to download/view the file
      }
    ],
  },
  { collection: "messages" }
);

export default mongoose.models.Message || mongoose.model("messages", messageSchema);
