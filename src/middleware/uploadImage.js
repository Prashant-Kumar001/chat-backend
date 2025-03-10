import multer from "multer";
import path from "path";
import fs from "fs";
import { CustomError } from "../error.js";

const uploadDir = "src/public/uploads/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const videoTypes = /\.(mp4|ogg|webm)$/i;
  const imageTypes = /\.(jpeg|jpg|png|gif|webp)$/i;
  const audioTypes = /\.(mp3|wav)$/i;
  const documentTypes = /\.(pdf|doc|docx|xls|xlsx|txt|ppt|pptx)$/i;

  const allowedMimes = /video\/(mp4|ogg|webm)|image\/(jpeg|jpg|png|gif|webp)|audio\/(mpeg|wav)|application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.ms-powerpoint|vnd.openxmlformats-officedocument.presentationml.presentation)|text\/plain/;


  const extname = videoTypes.test(file.originalname) || 
                  imageTypes.test(file.originalname) || 
                  audioTypes.test(file.originalname) ||
                  documentTypes.test(file.originalname);

  const mimetype = allowedMimes.test(file.mimetype);




  if (extname && mimetype) {
    cb(null, true);
  } else {
    return cb(new CustomError("Invalid file type", 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
