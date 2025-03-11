import multer from "multer";
import fs from "fs";
import sharp from "sharp";
import { CustomError } from "../error.js";

const uploadDir = "src/public/uploads/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  const allowedMimes = /video\/(mp4|ogg|webm)|image\/(jpeg|jpg|png|gif|webp)|audio\/(mpeg|wav)|application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet|vnd.ms-powerpoint|vnd.openxmlformats-officedocument.presentationml.presentation)|text\/plain/;

  if (allowedMimes.test(file.mimetype)) {
    cb(null, true);
  } else {
    return cb(new CustomError("Invalid file type. Please upload a valid file.", 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, 
})


const processFile = async (req, res, next) => {
  if (!req.file) return next(new CustomError("No file uploaded!", 400));

  const filePath = `${uploadDir}${Date.now()}-${req.file.originalname}`;

  try {
    if (req.file.mimetype.startsWith("image/")) {
      await sharp(req.file.buffer)
        .resize({ width: 1000 }) 
        .toFormat("webp") 
        .toFile(filePath);

      req.file.path = filePath; 
    } else {
      
      fs.writeFileSync(filePath, req.file.buffer);
      req.file.path = filePath;
    }
    next();
  } catch (error) {
    next(new CustomError("Error processing file", 500));
  }
};

export { upload, processFile };
