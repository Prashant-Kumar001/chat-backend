import express from "express";
import rateLimit from "express-rate-limit";

import { protectAdmin } from "../middleware/auth.Middleware.js";
import { adminOnly } from "../middleware/auth.Middleware.js";
import { fetchUsers, fetchChats, fetchMessages, fetchDashBordData, admin, logout, getAdminData } from "../controllers/admin.controller.js"
import { adminValidate } from "../validation/admin.validation.js"
const router = express.Router();



const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts. Try again later.",
});


router.post("/verify", adminValidate, admin)
router.get("/logout", logout)

router.use(protectAdmin, adminOnly);
router.get("/", getAdminData)
router.get("/users", fetchUsers)
router.get("/chats", fetchChats)
router.get("/messages", fetchMessages)
router.get("/stats", fetchDashBordData)

export default router;
