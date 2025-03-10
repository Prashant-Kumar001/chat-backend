import User from "../models/user.Model.js";
import { removeLocalFile } from "../utils/removeFile.js";
import { uploadFileToCloudinary } from "../utils/Cloudinary.js";
import { CustomError } from "../error.js";

// Register User
export const registerUser = async (username, name, email, password, bio, file) => {
  const local_filePath = file.path;

  const [usernameExists, emailExists] = await Promise.all([
    User.findOne({ username }),
    User.findOne({ email }),
  ]);

  if (usernameExists) {
    throw new CustomError("user with this Username is already exists", 400);
  }
  if (emailExists) {
    throw new CustomError("user with this Email is already exists", 400);
  }

  let cloudinary = {
    public_id: "",
    secure_url: "",
  };

  try {
    const res = await uploadFileToCloudinary(local_filePath);
    if (res?.public_id && res?.secure_url) {
      cloudinary = res;
    } else {
      throw new Error("Failed to upload image to Cloudinary");
    }
  } catch (uploadError) {
    throw new Error(uploadError.message);
  }


  const user = await User.create({
    username,
    name,
    email,
    password,
    avatar: cloudinary,
    bio,
  });

  return { user };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select(
    "username email password avatar role"
  );
  if (!user || !(await user.comparePassword(password))) {
    throw new CustomError("Invalid credentials", 401);
  }

  return { user };
};



export const isLogin = async (user) => {
  const isLoggedIn = await User.findOne({ _id: user._id });
  if (!isLoggedIn) throw new CustomError("User not found", 404);
  return isLoggedIn;
};


export const searchUser = async () => { };
