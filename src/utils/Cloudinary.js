import cloudinary from "../config/cloudinaryConfig.js";
import { removeLocalFile } from "./removeFile.js";
import { randomUUID } from "crypto";
export const uploadFileToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "chat_user_files",
    });
    return result;
  } catch (error) {
    throw new Error(error);
  } finally {
    if (filePath) {
      removeLocalFile(filePath);
    }
  }
};

const uploadFilesToCloudinary = async (files = []) => {
  try {
    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "chat_users_attachments",
        public_id: randomUUID().toString(),
        resource_type: "auto",
        
      })
    );
    const results = await Promise.all(uploadPromises);
    return results.map(({ public_id, secure_url }) => ({
      public_id,
      secure_url,
    }));
  } catch (err) {
    throw new Error(`Error uploading files to cloudinary: ${err.message}`);
  } finally {
    files.forEach((file) => removeLocalFile(file.path));
  }
};

const deleteFilesFromCloudinary = async (public_ids) => {
  // Delete files from cloudinary
};

export { uploadFilesToCloudinary, deleteFilesFromCloudinary };
