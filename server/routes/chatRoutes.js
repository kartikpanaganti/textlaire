import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroupChat,
  addToGroupChat,
  removeFromGroupChat,
} from "../controllers/chatController.js";

const router = express.Router();

// Protected routes - require authentication
router.use(authMiddleware);

// Routes for chats
router.route("/").post(accessChat).get(fetchChats);
router.route("/group").post(createGroupChat);
router.route("/rename").put(renameGroupChat);
router.route("/groupadd").put(addToGroupChat);
router.route("/groupremove").put(removeFromGroupChat);

export default router;
