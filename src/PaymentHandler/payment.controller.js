import crypto from "crypto";
import { Payment } from "../models/payment.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { paymentInstance } from "./paymentInstance.js";

const createPayment = asyncHandler(async (req, res) => {
  const { course_Id, amount, receiver_Id } = req.body;

  const instance = await paymentInstance();
  try {
    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    };

    instance.orders.create(options, async (error, order) => {
      if (error) {
        console.log(error);
        throw new ApiError(500, error.message);
      }

      if (!order) {
        throw new ApiError(500, "Order Id Could not generated!");
      }

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            order,
            "Payment Created pay amount: " + order.amount
          )
        );
    });
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal Server Error!");
  }
});
const validatePayment = asyncHandler(async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      amount,
      course_Id,
      receiver_Id,
    } = req.body;
    const sha = crypto.createHmac(
      "sha256",
      process.env.RAZOR_PAY_API_KEY_SECRET
    );

    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const signature = sha.digest("hex");
    if (signature !== razorpay_signature) {
      const status = await Payment.findByIdAndDelete(_id);

      throw new ApiError(400, "Transaction is not ligit!");
    }

    const payment = await Payment.create({
      amount,
      sender_Id: req.user?._id,
      course_Id: course_Id ? course_Id : null,
      receiver_Id: receiver_Id ? receiver_Id : null,
      amount: amount,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      // status:order.status,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, payment, "Transaction successfull !"));
  } catch (error) {}
});
export { createPayment, validatePayment };
