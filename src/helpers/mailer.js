import nodemailer from "nodemailer";
// import VerificationEmail from '../emails/VerificationEmail.js'

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export const sendVerificationEmail = async ({
  email,
  username,
  verifyCode,
}) => {
  try {
    const mailOptions = {
      from: " adityakumar41190@gmail.com", // sender address
      to: email, // list of receivers

      subject: "innovadi lms Verification Code",
      html: `
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">
                <h2 style="background-color: #4CAF50; color: #ffffff; text-align: center; padding: 10px;">Email Verification</h2>
                <p>Hello ${username},</p>
                <p>Thank you for registering with us! Please use the following OTP to verify your email address:</p>
                <h3 style="color: #4CAF50; text-align: center;">${verifyCode}</h3>
                <p>If you didn’t request this email, you can ignore this message.</p>
                <p style="text-align: center;"><a href="localhost:3000/verify/${username}?otp=${verifyCode}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
                <p>&copy; 2024 Your innovadi. All rights reserved.</p>
              </div>
            `
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

export const sendWelcomeEmail = async ({email,username,name}) => {
  try {
    const mailOptions = {
      from: " adityakumar41190@gmail.com", // sender address
      to: email, // list of receivers

      subject: "Welcome to your lms plateform innovadi",
      html: `<b>welcome ${username}</b><br><b>Your verification code is ${verifyCode}</b> `
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

export const sendResetEmail = async ({
  email,
  username,
  resetToken,
}) => {

  try {
    const resetUrl = `${process.env.CLIENT}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: " adityakumar41190@gmail.com", // sender address
      to: email, // list of receivers


      subject: "Reset password link from innovadi ",
      html: `
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">
                <h2 style="background-color: #4CAF50; color: #ffffff; text-align: center; padding: 10px;">Password Reset Request</h2>
                <p>Hello ${username},</p>
                <p>You requested to reset your password. Please click the link below to reset your password:</p>
                
                <p>If you didn’t request this email, you can ignore this message.</p>
                <p style="text-align: center;"><a href="${resetUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                <p>&copy; 2024 Your innovadi. All rights reserved.</p>
              </div>
            `
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};