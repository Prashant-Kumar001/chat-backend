import joi from "joi";
import ResponseHandler from "../utils/responseHandler.js";
import statusCodes from "../utils/statusCodes.js";

const adminValidate = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().required().email(),
    password: joi.string().required(),
  });
  console.log(req.body);
  const { error } = schema.validate(req.body);
  if (error) {
    return ResponseHandler.error(res, statusCodes.BAD_REQUEST, error.details[0].message);
  }
  next();
}

export { adminValidate };

