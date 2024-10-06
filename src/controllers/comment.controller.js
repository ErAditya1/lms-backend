import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { getBlogPostData } from "./post.controller.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { video_Id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  return res.status(200).json(new ApiResponse(200, data, "Data fetched"));
});

const addPostComment = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;
  const { comment } = req.body;
  const data = await Comment.create({
    comment,
    post_Id:_id,
    user_Id: req.user?._id,
  });
  return res.status(200).json(new ApiResponse(200, data, "Post Comment added"));
   
});

const addCourseComment = asyncHandler(async (req, res, next) => {
  const { _id } = req.params;
  const { comment } = req.body;
  const data = await Comment.create({
    comment,
    course_Id:_id,
    user_Id: req.user?._id,
  });
  return res.status(200).json(new ApiResponse(200, data, "Post Comment added"));
   
});


const addVideoComment = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const {comment} = req.body;
  const data = await Comment.create({
    comment,
    video_Id: _id,
    user_Id: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Video comment added"));
});
const addCommentReply = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const {comment} = req.body;
  const data = await Comment.create({
    comment,
    comment_Id:_id,
    user_Id: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Comment reply added"));
});

TODO : "Test it before use"

const updateComment = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const {comment} = req.body;
  const data = await Comment.findByIdAndUpdate(_id, {
    comment_Id,
    comment,
  });

  return res.status(200).json(new ApiResponse(200, data, "Comment is updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const data = await Comment.findByIdAndDelete(_id);

  return res.status(200).json(new ApiResponse(200, "", "Comment is deleted"));
});

export {
  getVideoComments,
  addPostComment,
  addCourseComment,
  addVideoComment,
  addCommentReply,
  updateComment,
  deleteComment,
};
