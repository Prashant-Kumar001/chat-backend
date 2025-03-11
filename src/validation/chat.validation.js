import Joi from "joi";
import ResponseHandler from "../utils/responseHandler.js";
import mongoose from "mongoose";

export const validateGroup = (req, res, next) => {
  const { members } = req.body;

  const isCurrentUSer = members?.find(
    (member) => member === req.user?._id.toString()
  );

  if (isCurrentUSer) {
    return ResponseHandler.error(
      res,
      400,
      "You can't add yourself to the group [bhosdivale apne app ko kyo add kr kra hai] you are already in the group "
    );
  }

  const groupSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    members: Joi.array()
      .items(Joi.string().trim().required())
      .min(2)
      .required(),
  });
  const { error } = groupSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return ResponseHandler.error(
      res,
      400,
      error.details.map((err) => err.message).join(", ")
    );
  }

  next();
};

export const validateUserAdd = (req, res, next) => {
  const UserAddSchema = Joi.object({
    chatId: Joi.required(),
    members: Joi.array().items(Joi.string().trim().required()).required(),
  });

  const { error } = UserAddSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return ResponseHandler.error(
      res,
      400,
      error.details.map((err) => err.message).join(", ")
    );
  }
  next();
};

export const validateUserRemove = (req, res, next) => {
  const objectIdValidation = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  };

  const UserRemoveSchema = Joi.object({
    userId: Joi.string()
      .trim()
      .custom(objectIdValidation, "MongoDB ObjectId validation")
      .required()
      .messages({
        "string.base": "User ID must be a string",
        "string.empty": "User ID is required",
        "any.required": "User ID is required",
        "any.invalid": "User ID must be a valid MongoDB ObjectId",
      }),
    chatId: Joi.string()
      .trim()
      .custom(objectIdValidation, "MongoDB ObjectId validation")
      .required()
      .messages({
        "string.base": "Chat ID must be a string",
        "string.empty": "Chat ID is required",
        "any.required": "Chat ID is required",
        "any.invalid": "Chat ID must be a valid MongoDB ObjectId",
      }),
  });

  const { error } = UserRemoveSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return ResponseHandler.error(
      res,
      400,
      error.details.map((err) => err.message).join(", ")
    );
  }
  next();
};

export const validateParams = (req, res, next) => {
  const paramsSchema = Joi.object({
    chatId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Invalid userId format. Must be a valid MongoDB ObjectId",
        "any.required": "User ID is required",
      }),
  });

  const { error } = paramsSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

export const validateAttachment = (req, res, next) => {
  const objectIdValidation = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  };

  const UserRemoveSchema = Joi.object({
    chatId: Joi.string()
      .trim()
      .custom(objectIdValidation, "MongoDB ObjectId validation")
      .required()
      .messages({
        "string.base": "User ID must be a string",
        "string.empty": "User ID is required",
        "any.required": "User ID is required",
        "any.invalid": "User ID must be a valid MongoDB ObjectId",
      }),
  });

  const { error } = UserRemoveSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return ResponseHandler.error(
      res,
      400,
      error.details.map((err) => err.message).join(", ")
    );
  }
  next();
};

export const validateRenamed = (req, res, next) => {
  const paramsSchema = Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid ID format. Must be a valid MongoDB ObjectId",
        "any.required": "ID is required",
      }),
  });

  // Validate `newName` in `req.body`
  const bodySchema = Joi.object({
    newGroupName: Joi.string().trim().min(3).max(50).required().messages({
      "string.base": "New name must be a string",
      "string.empty": "New name is required",
      "string.min": "New name must be at least 3 characters",
      "string.max": "New name must not exceed 50 characters",
      "any.required": "New name is required",
    }),
  });

  // Validate `req.params`
  const paramsValidation = paramsSchema.validate(req.params);
  if (paramsValidation.error) {
    return res.status(400).json({ message: paramsValidation.error.details[0].message });
  }

  // Validate `req.body`
  const bodyValidation = bodySchema.validate(req.body);
  if (bodyValidation.error) {
    return res.status(400).json({ message: bodyValidation.error.details[0].message });
  }

  next();
};

export const validateRequest = (req, res, next) => {
  const body = Joi.object({
    userId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid ID format. Must be a valid MongoDB ObjectId",
        "any.required": "UserID is required",
      }),
  });

  const { error } = body.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ message: error.details.map((err) => err.message).join(", ") });
  }
  next();
};


export const validateAcceptRequest = (req, res, next) => {
  const body = Joi.object({
    requestId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid ID format. Must be a valid MongoDB ObjectId",
        "any.required": "RequestID is required",
      }),
    status: Joi.string().valid("accepted", "rejected").required()
  });

  const { error } = body.validate(req.body, { abortEarly: false });

  if (error) {
    return ResponseHandler.error(
      res,
      400,
      error.details.map((err) => err.message).join(", ")
    );
  }
  next();
};
