import ResponseHandler from "../utils/responseHandler.js";
import { registerUser, loginUser, isLogin } from "../services/auth.Service.js";
import statusCodes from "../utils/statusCodes.js";
import { generateToken } from "../utils/helper.js";

const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

export const register = async (req, res) => {
  try {
    const { username, name, email, password, bio } = req.body;
    const { file } = req;

    const userData = await registerUser(
      username,
      name,
      email,
      password,
      bio,
      file
    );

    const metadata = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    return ResponseHandler.success(
      res,
      statusCodes.CREATED,
      "User registered successfully",
      userData,
      metadata
    );
  } catch (error) {
    return ResponseHandler.error(res, error.statusCode, error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { user } = await loginUser(email, password);

    const token = generateToken(user._id);

    res.cookie("auth_token", token, cookieOptions);

    const metadata = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    return ResponseHandler.success(
      res,
      statusCodes.OK,
      "Login successful",
      {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        token,
        isLoggedIn: true,
      },
      metadata
    );
  } catch (error) {
    if (error.message === "Invalid credentials") {
      return ResponseHandler.error(
        res,
        statusCodes.NOT_FOUND,
        "Invalid email or password."
      );
    }

    return ResponseHandler.error(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      "Login failed",
      error.message
    );
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("auth_token");
    return res.status(200).json({
      message: "Logout successful",
      success: true,
      data: null,
      token: null,
    });
  } catch (error) {
    return ResponseHandler.error(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      "Logout failed",
      error.message
    );
  }
};

export const isLoginTrue = async (req, res) => {
  try {
    const user = await isLogin(req.user);

    const metadata = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    };

    return ResponseHandler.success(
      res,
      statusCodes.OK,
      "Login status checked",
      {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        isLoggedIn: true,
      },
      metadata
    );
  } catch (error) {
    return ResponseHandler.error(
      res,
      error.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};
