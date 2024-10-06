import mongoose, { Schema } from "mongoose";
import { number } from "zod";
const courseSchema = new Schema(
  {
   
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, 
    thumbnail:  {
      public_id:{
        type: String,
        
      },
      secure_url:{
        type: String,
        
      },
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      
    },
    language: {
      type: String,
      enum:["English", "Hindi"],
      
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    printPrice: {
      type: Number,
  
    },
    sellingPrice: {
      type: Number,
      
    },
    discount:{
      type: Number,
      
    },
    from: {
      type: Date,
      
    },
    to: {
      type: Date,
      
    },
    chapters:[
      {
        _id:{
          type: Schema.Types.ObjectId,
          ref: "Video",
          required: true,
        },
        position:{
          type: Number,
          required: true,
        }
      }

    ]
  },
  {
    timestamps: true,
  }
);

export const Course = mongoose.model("Course", courseSchema);
