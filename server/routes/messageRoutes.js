import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  sendMessage,
  getAllMessages,
  markMessagesAsRead,
  deleteMessage,
  clearChatHistory,
  upload
} from "../controllers/messageController.js";

const router = express.Router();

// Protected routes - require authentication
router.use(authMiddleware);

// Routes for messages
router.route("/").post(upload.array("files", 5), sendMessage); // Allow up to 5 file uploads
router.route("/:chatId").get(getAllMessages);
router.route("/read/:chatId").put(markMessagesAsRead);
router.route("/clear/:chatId").delete(clearChatHistory);
router.route("/:messageId").delete(deleteMessage);

export default router;
