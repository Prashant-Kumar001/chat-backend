import jwt from "jsonwebtoken";
import config from "../config/dotenv.js";

export const generateToken = (user) => {
  return jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN || '7d' });
};