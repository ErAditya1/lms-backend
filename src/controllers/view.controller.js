import mongoose from "mongoose";
import { View } from "../models/view.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
// import { ApiResponse } from "../utils/ApiResponse.js";

const postViews = asyncHandler(async (req, res, next) => {
    const { _id } = req.params
    if(!_id){
        throw new ApiError(400, "Id i0s missing")
    }
    const view = await View.findOne({
        post_Id: _id ,
        user_Id: req.user._id
    })
    if(!view){
        const newView = await View.create({
            post_Id: _id,
            user_Id: req.user._id
        })
    }
    
    next()
})

const courseViews = asyncHandler(async (req, res, next) => {
    const { _id } = req.params
    if(!_id){
        throw new ApiError(400, "Id i0s missing")
    }
    const view = await View.findOne({
        course_Id: _id ,
        user_Id: req.user._id
    })
    if(!view){
        const newView = await View.create({
            course_Id: _id,
            user_Id: req.user._id
        })
        console.log(newView)

    }
    
    next()
})

const videoViews = asyncHandler(async (req, res, next) => {
    const { _id } = req.params
    if(!_id){
        throw new ApiError(400, "Id is missing")
    }
    const view = await View.findOne({
        video_Id: _id ,
        user_Id: req.user._id
    })
    if(!view){
        const newView = await View.create({
            video_Id: _id,
            user_Id: req.user._id
        })
        console.log(newView)
    }
    
    next()
})


export { postViews , courseViews , videoViews}
