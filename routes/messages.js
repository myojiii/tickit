import { Router } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
import { getMessages, postMessage, markTicketNotificationsRead } from "../controllers/messageController.js";

const router = Router();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "tickit/messages",
    resource_type: "auto",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "svg", "pdf", "doc", "docx", "txt", "webp"],
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
