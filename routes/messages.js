import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getMessages, postMessage, markTicketNotificationsRead } from "../controllers/messageController.js";

const router = Router();

// Configure multer for file uploads
// Use /tmp on Vercel (read-only fs) and public/uploads locally
const uploadDir = process.env.VERCEL
  ? path.join(process.env.TMPDIR || "/tmp", "uploads", "messages")
  : path.join("public", "uploads", "messages");

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.error("Failed to create upload directory:", uploadDir, err);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/*",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const isAllowed = allowedTypes.some((type) => {
      if (type === "image/*") return file.mimetype.startsWith("image/");
      return file.mimetype === type;
    });

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

router.get("/api/tickets/:ticketId/messages", getMessages);
router.post("/api/tickets/:ticketId/messages", upload.array("attachments", 5), postMessage);
router.patch("/api/notifications/ticket/:ticketId/read", markTicketNotificationsRead);

export default router;
