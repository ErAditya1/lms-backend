import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema(
  {
    name: {
      type: String,
      index: true,
    },
    mobileNumber: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Email Id is required"],
      unique: [true, "Email should be unique"],
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: [true, "Username should be unique"],
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['', 'admin', 'student', 'teacher','parent'], // Define allowed user types
      default: '', // Default role is 'user'
    },
    

    avatar: {
      public_id:{
        type: String,
      },
      url:{
        type: String,
      }
    },
    coverImage: {
      public_id:{
        type: String,
      },
      url:{
        type: String,
      }
    },
    about: {
      type: String,
    },
    verifyCode: {
      type: String,
    },
    verifyCodeExpiry: {
      type: Date,
    },
    isOnline:{
      type: Boolean,
      default: false,
    },
    resetToken:{
      type: String,
    },
    resetTokenExpiry: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin:{
      type: Boolean,
      default: false,
    },
   
    password: {
      type: String,
      required: [true, "passwerd is required"],
    },
    refreshToken: {
      type: String,
    },
    accessToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};


userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      name: this.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.REFRESF_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateResetToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.RESET_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
