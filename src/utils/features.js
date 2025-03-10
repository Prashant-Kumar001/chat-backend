import cloudinary from "../config/cloudinaryConfig.js";
import { getSocketId } from "../lib/helper.js";

const emitEvent = (req, event, users, data) => {
  const io = req?.app?.get("io");
  const usersSocket = getSocketId(users);
  io.to(usersSocket).emit(event, data);
};

const deleteFileFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok") {
      console.log(`Image with public_id "${publicId}" deleted successfully.`);
      return true;
    } else {
      console.log(
        `Failed to delete image with public_id "${publicId}":`,
        result
      );
      return false;
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return false;
  }
};

export { emitEvent, deleteFileFromCloudinary };
