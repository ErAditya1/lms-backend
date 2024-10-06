import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema(
  {
    user_Id:{
      type: mongoose.Types.ObjectId,
      ref: "User"
    },
    course_Id:{
      type: mongoose.Types.ObjectId,
      ref : "Course"
    },
    tittle: {
      type: "string",
      required: true,
    },
    file: {
      type: "string",
      required: true,
    },
  },
  { timestamps: true }
);

export const File = mongoose.model("File", fileSchema);
