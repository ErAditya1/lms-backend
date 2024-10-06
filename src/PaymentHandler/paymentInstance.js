import Razorpay from "razorpay";

const paymentInstance = async()=>{
   try {
     const instance = new Razorpay({
         key_id: process.env.RAZOR_PAY_API_KEY_ID,
         key_secret: process.env.RAZOR_PAY_API_KEY_SECRET,
         // mode: process.env.RAZORPAY_MODE
     })
     
     return instance;
   } catch (error) {
        console.log(error);
   }
}

export {paymentInstance}