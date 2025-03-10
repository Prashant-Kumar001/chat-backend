import express from "express";
import {
  fetchUserById,
  modifyUser,
  removeUser,
  getMyProfile,
  searchUser,
  SendRequest,
  acceptRequest,
  notifyMe,
  friends

} from "../controllers/user.Controller.js";
import { protect, adminOnly } from "../middleware/auth.Middleware.js";
import { validateRequest, validateAcceptRequest } from "../validation/chat.validation.js"

const router = express.Router();

router.use(protect);

router.get("/me", getMyProfile);
router.get("/search", searchUser);
router.post('/request', validateRequest, SendRequest)
router.put('/acceptRequest', validateAcceptRequest, acceptRequest)
router.get('/notification', notifyMe)
router.get('/friends', friends)
router
  .route("/:id")
  .get(fetchUserById)
  .put(modifyUser)
  .delete(adminOnly, removeUser);

export default router;
