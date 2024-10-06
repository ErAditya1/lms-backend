import mongoose, {Schema} from "mongoose";

const paymentSchema = new Schema({
    amount: {
        type: Number,
        required: true,
    },
    sender_Id : {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver_Id : {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    course_Id: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    
    razorpay_payment_id: {
        type: String,
    },
    razorpay_order_id: {
        type: String,
    },
    razorpay_signature: {
        type: String,
    },
   
    
   
},{timestamps:true});

export const Payment = mongoose.model("Payment", paymentSchema);