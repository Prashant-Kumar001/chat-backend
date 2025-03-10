import express from "express";
import {
    register,
    login,
    logout,
    isLoginTrue,
} from "../controllers/auth.Controller.js";
import { protect } from "../middleware/auth.Middleware.js";
import upload from "../middleware/uploadImage.js";
const router = express.Router();
import { validateUserInput, loginValidator } from "../validation/auth.validation.js"

router.post("/register", upload.single('image'), validateUserInput, register);
router.post("/login", loginValidator, login);
router.get("/logout", logout);
router.get("/me", protect, isLoginTrue);

export default router;
