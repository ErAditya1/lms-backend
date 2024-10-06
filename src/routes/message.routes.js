import { Router } from "express";
import {
  deleteMessage,
  getAllMessages,
  sendMessage,
} from "../controllers/message.controllers.js";
import { sendMessageValidator } from "../validators/message.validators.js";
import { mongoIdPathVariableValidator } from "../validators/common/mongodb.validators.js";
import { validate } from "../validators/validate.js";
import { verifyJWT } from "../middelwares/auth.middelware.js";
import { upload } from "../middelwares/multer.middelware.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/:chatId")
  .get(mongoIdPathVariableValidator("chatId"), validate, getAllMessages)
  .post(
    upload.fields([{ name: "attachments", maxCount: 5 }]),
    mongoIdPathVariableValidator("chatId"),
    sendMessageValidator(),
    validate,
    sendMessage
  );

//Delete message route based on Message id

router
  .route("/:chatId/:messageId")
  .delete(
    mongoIdPathVariableValidator("chatId"),
    mongoIdPathVariableValidator("messageId"),
    validate,
    deleteMessage
  );

export default router;
