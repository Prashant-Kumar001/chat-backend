import express from "express";
import { protect } from "../middleware/auth.Middleware.js";
import {
  newGroupChat,
  getUserChats,
  getUserGroups,
  addMembers,
  removeMembers,
  leaveGroup,
  sendAttachment,
  getChatDetails,
  renameGroup,
  deleteChat,
  getMessages,
} from "../controllers/chat.controller.js";
import { upload } from "../middleware/uploadImage.js";
import {
  validateGroup,
  validateUserAdd,
  validateUserRemove,
  validateParams,
  validateAttachment,
  validateRenamed
} from "../validation/chat.validation.js";
const router = express.Router();
router.use(protect);

router.post("/", validateGroup, newGroupChat);
router.get("/my", getUserChats);
router.get("/my/groups", getUserGroups);
router.put("/add", validateUserAdd, addMembers);
router.put("/remove", validateUserRemove, removeMembers);
router.delete("/leave/:chatId", validateParams, leaveGroup);

// send attachments
router.post("/attachment", upload.array("files", 5), validateAttachment, sendAttachment);

// get messages
router.get("/message/:id", getMessages);

//get chat details, rename, delete
router
  .route("/:chatId")
  .get(validateParams, getChatDetails)
  .put(validateRenamed, renameGroup)
  .delete(validateParams, deleteChat);

export default router;
