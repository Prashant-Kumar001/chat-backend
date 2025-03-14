import ResponseHandler from "../utils/responseHandler.js";
import {
  getAllUsers,
  getAllChats,
  getAllMessages,
  getDashBordData,
  adminLogin,
} from "../services/admin.service.js";
import statusCodes from "../utils/statusCodes.js";
import { cookieOptions } from "../utils/helper.js";

export const fetchUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const users = await getAllUsers(page, limit);
    const metadata = {
      page,
      limit,
      total: users.total,
      totalPages: Math.ceil(users.total / limit),
      hasNextPage: page * limit < users.total,
      hasPreviousPage: page > 1,
      nextPage: page * limit < users.total ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };
    return ResponseHandler.success(
      res,
      statusCodes.OK,
      "Users fetched successfully",
      users,
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
export const fetchChats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const chats = await getAllChats(page, limit);
    const metadata = {
      page,
      limit,
      total: chats.total,
      totalPages: Math.ceil(chats.total / limit),
      hasNextPage: page * limit < chats.total,
      hasPreviousPage: page > 1,
      nextPage: page * limit < chats.total ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };
    return ResponseHandler.success(
      res,
      statusCodes.OK,
      "Chats fetched successfully",
      chats,
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
export const fetchMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const messages = await getAllMessages(page, limit);
    const metadata = {
      page,
      limit,
      total: messages.total,
      totalPages: Math.ceil(messages.total / limit),
      hasNextPage: page * limit < messages.total,
      hasPreviousPage: page > 1,
      nextPage: page * limit < messages.total ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };
    return ResponseHandler.success(
      res,
      statusCodes.OK,
      "Messages fetched successfully",
      messages,
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
export const fetchDashBordData = async (req, res) => {
  try {
    const Data = await getDashBordData();
    return ResponseHandler.success(
      res,
      statusCodes.OK,
      "Dashboard data fetched successfully",
      Data
    );
  } catch (error) {
    return ResponseHandler.error(
      res,
      error.statusCode || statusCodes.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};
export const admin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { admin, token } = await adminLogin(email, password);

    const metaData = {
      role: admin.role,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      expire: "15m",
    };

    res.cookie("adminToken", token, cookieOptions);

    return ResponseHandler.success(
      res,
      statusCodes.OK,
      "Admin logged in successfully",
      { admin, token },
      metaData
    );
  } catch (error) {
    return ResponseHandler.error(
      res,
      error.statusCode ||
        statusCodes.INTERNAL_SERVER_ERROR ||
        "Internal Server Error",
      error.message
    );
  }
};
export const logout = async (req, res) => {
  try {
    res.clearCookie("adminToken");
    return ResponseHandler.success(res, statusCodes.OK, "Logout successful");
  } catch (error) {
    return ResponseHandler.error(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      "Logout failed",
      error.message
    );
  }
};

export const getAdminData = (req, res) => {
  res.json({
    admin: true,
    timestamp: new Date().toISOString(),
    message: "welcome Admin",
  });
};
