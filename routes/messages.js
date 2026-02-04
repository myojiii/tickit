import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getMessages, postMessage, markTicketNotificationsRead } from "../controllers/messageController.js";

const router = Router();

// Configure multer for file uploads
const uploadDir = "public/uploads/messages";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp_originalname
    const uniqueName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = ['image/*', 'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'];
    
    const isAllowed = allowedTypes.some(type => {
      if (type === 'image/*') return file.mimetype.startsWith('image/');
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
