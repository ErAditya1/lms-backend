import { Router } from "express";
import { verifyJWT } from "../middelwares/auth.middelware.js";
import { createPayment, validatePayment } from "../PaymentHandler/payment.controller.js";


const router = new Router();

router.route("/order").post(verifyJWT, createPayment)
router.route("/validate").post(verifyJWT, validatePayment)
export default router;
