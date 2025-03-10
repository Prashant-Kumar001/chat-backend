import jwt from "jsonwebtoken";
import JWT_SECRET from '../config/dotenv.js'
import JWT_EXPIRES_IN from '../config/dotenv.js'

export const generateToken = (user) => {
  return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d' });
};