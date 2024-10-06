import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { deleteCloudinaryFile, uploadOnCloudinary } from "../utils/cloudinary.js";

const addVideo = asyncHandler(async (req, res) => {
  console.log("addChapter");
  const { title, description, videoId } = req.body;
  const { _id } = req.params;

  if (!_id) {
    throw new ApiError(404, "Course ID is required");
  }
  if (!title || !description || !videoId) {
    throw new ApiError(404, "All fields are required");
  }

  const video = await Video.create({
    title,
    description,
    videoId,
    course_id: _id,
    author: req.user._id,
  });
  if (!video) {
    throw new ApiError(500, "Failed to create video");
  }

  const totalChapters = await Course.findById(_id);

  const course = await Course.findByIdAndUpdate(_id, {
    $push: {
      chapters: [
        {
          _id: video._id,
          position: totalChapters.chapters.length,
        },
      ],
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, course, "Video added successfully"));
});
 
const getVideo = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(404, "Video ID is required");
  }
  const video = await Video.findById(_id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  console.log("Video", video);
  return res.json(new ApiResponse(200, video, "Video fetched successfully"));
})
TODO: "fix to the updation";

const updateVideoId = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { videoId } = req.body;

  if (!_id) {
    throw new ApiError(404, "Video ID is required");
  }
  if (!videoId) {
    throw new ApiError(404, "Video ID is required");
  }

  const video = await Video.findByIdAndUpdate(_id, { videoId }, { new: true });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
   .status(200)
   .json(new ApiResponse(200, video, "Video ID updated successfully"));
});

const updateTitle = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { title } = req.body;

  console.log(_id)

  if (!_id) {
    throw new ApiError(404, "Video ID is required");
  }
  if (!title) {
    throw new ApiError(404, "Title is required");
  }

  const video = await Video.findByIdAndUpdate(_id, { title }, { new: true });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
   .status(200)
   .json(new ApiResponse(200, video, "Video title updated successfully"));
});

const updateDescription = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { description } = req.body;

  if (!_id) {
    throw new ApiError(404, "Video ID is required");
  }
  if (!description) {
    throw new ApiError(404, "Description is required");
  }

  const video = await Video.findByIdAndUpdate(_id, { description }, { new: true });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
   .status(200)
   .json(new ApiResponse(200, video, "Video description updated successfully"));
})


const updateThumbnail = asyncHandler(async (req, res) => {
  const { _id } = req.params;
 
  const thumbnailFilePath = req.file?.path;
  if (!thumbnailFilePath) throw new ApiError(404, "File not found");
  
  let thumbnailFile;
  if (thumbnailFilePath) {
    thumbnailFile = await uploadOnCloudinary(thumbnailFilePath);
  }
  if (!_id) {
    throw new ApiError(404, "Video ID is required");
  }
  if(!thumbnailFile) throw new ApiError(500, "Thumbnail upload faild")

  

  const video = await Video.findById(_id);


  if (!video) {
    throw new ApiError(404, "Video not found");
  }


  // Delete old thumbnail from cloudinary
  if (video.thumbnail) {
    await deleteCloudinaryFile(video.thumbnail.public_id);
  }

  video.thumbnail.public_id = thumbnailFile?.public_id;
  video.thumbnail.secure_url = thumbnailFile?.secure_url;

  const newVideo = await video.save();
 
  return res
   .status(200)
   .json(new ApiResponse(200, newVideo, "Video thumbnail updated successfully"));
});

const updateVisibility = asyncHandler(async(req, res)=>{
  const { _id } = req.params;
  const { isFree } = req.body;

  if (!_id) {
    throw new ApiError(404, "Video ID is required");
  }
  if (!isFree) {
    throw new ApiError(404, "Visibility is required");
  }

  const video = await Video.findByIdAndUpdate(_id, { isFree }, { new: true });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
   .status(200)
   .json(new ApiResponse(200, video, "Video visibility updated successfully"));
})

const publishVideo = asyncHandler(async(req, res)=>{
  const { _id } = req.params;

  if (!_id) {
    throw new ApiError(404, "Video ID is required");
  }

  const video = await Video.findById(_id);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if(!video.title) {throw new ApiError(401, "Video title is required");}
  if(!video.description) {throw new ApiError(401, "Video description is required");}
  if(!video.videoId){ throw new ApiError(401, "Video ID is required");}
  if(!(video.thumbnail?.public_id)) {throw new ApiError(401, "Video thumbnail is required");}

  video.isPublished = true;
  video.publishedAt = new Date();

  const response= await video.save();

  

  return res
   .status(200)
   .json(new ApiResponse(200, response, "Video published successfully"));
})

const unpublishVideo = asyncHandler(async(req, res)=>{
  const { _id } = req.params;

  if (!_id) {
    throw new ApiError(404, "Video ID is required");
  }

  const video = await Video.findByIdAndUpdate(_id, { isPublished: false }, { new: true });

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
   .status(200)
   .json(new ApiResponse(200, video, "Video Unpublished successfully"));
})


TODO: "fix to the deletion"

const deleteVideo = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(404, "Video ID is required");
  }
  const video = await Video.findById(_id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  

  // Delete video from database
  await Video.findByIdAndDelete(_id);

  return res
   .status(200)
   .json(new ApiResponse(200, null, "Video deleted successfully"));
})


const getVideoData = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(404, "Video Id is required");
  }
  const videoData = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      },
    },
    // Getting author of the video
    {
      $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              name: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    
    // getting comments about video
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video_Id",
        as: "comments",
        pipeline: [
          // Lookup for comment author
          {
            $lookup: {
              from: "users",
              localField: "user_Id",
              foreignField: "_id",
              as: "author",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    name: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          // lookup for comments reply
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "comment_Id",
              as: "commentsReply",

              pipeline: [
                // lookup for author of coments reply
                {
                  $lookup: {
                    from: "users",
                    localField: "user_Id",
                    foreignField: "_id",
                    as: "author",
                    pipeline: [
                      {
                        $project: {
                          _id: 1,
                          username: 1,
                          name: 1,
                          avatar: 1,
                        },
                      },
                    ],
                  },
                },
                // lookup for likes of comment reply
                {
                  $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment_Id",
                    as: "likes",
                    pipeline: [
                      {
                        $lookup: {
                          from: "users",
                          localField: "user_Id",
                          foreignField: "_id",
                          as: "author",
                          pipeline: [
                            {
                              $project: {
                                _id: 1,
                                username: 1,
                                name: 1,
                                avatar: 1,
                              },
                            },
                          ],
                        },
                      },

                      {
                        $addFields: {
                          author: {
                            $arrayElemAt: ["$author", 0],
                          },
                        },
                      },
                    ],
                  },
                },
                // add fields in comments reply
                {
                  $addFields: {
                    author: {
                      $arrayElemAt: ["$author", 0],
                    },
                    isAuthor: {
                      $cond: {
                        if: { $in: [req.user?._id, "$author._id"] },
                        then: true,
                        else: false,
                      },
                    },

                    likeCount: {
                      $size: "$likes",
                    },
                    isLiked: {
                      $cond: {
                        if: { $in: [req.user?._id, "$likes.user_Id"] },
                        then: true,
                        else: false,
                      },
                    },
                  },
                },
                // projection of comment reply
                {
                  $project: {
                    _id: 1,
                    author: 1,
                    isAuthor: 1,
                    createdAt: 1,
                    likeCount: 1,
                    isLiked: 1,
                    likes: 1,
                    comment: 1,
                  },
                },
              ],
            },
          },
          // lookup for likes of comments
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "comment_Id",
              as: "likes",
              pipeline: [
                {
                  $lookup: {
                    from: "users",
                    localField: "user_Id",
                    foreignField: "_id",
                    as: "author",
                    pipeline: [
                      {
                        $project: {
                          _id: 1,
                          username: 1,
                          name: 1,
                          avatar: 1,
                        },
                      },
                    ],
                  },
                },

                {
                  $addFields: {
                    author: {
                      $arrayElemAt: ["$author", 0],
                    },
                  },
                },
              ],
            },
          },
          // add fields in comment
          {
            $addFields: {
              author: {
                $arrayElemAt: ["$author", 0],
              },
              isAuthor: {
                $cond: {
                  if: { $in: [req.user?._id, "$author._id"] },
                  then: true,
                  else: false,
                },
              },
              replyCount: {
                $size: "$commentsReply",
              },
              likeCount: {
                $size: "$likes",
              },
              isLiked: {
                $cond: {
                  if: { $in: [req.user?._id, "$likes.user_Id"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          // projection in comment
          {
            $project: {
              _id: 1,
              author: 1,
              isAuthor: 1,
              comment: 1,
              createdAt: 1,
              commentsReply: 1,
              replyCount: 1,
              likeCount: 1,
              isLiked: 1,
              likes: 1,
            },
          },
        ],
      },
    },
    // getting likes
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video_Id",
        as: "likes",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "user_Id",
              foreignField: "_id",
              as: "author",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    name: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              author: {
                $arrayElemAt: ["$author", 0],
              },
            },
          },
        ],
      },
    },
    // getting views
    {
      $lookup: {
        from: "views",
        localField: "_id",
        foreignField: "video_Id",
        as: "viewers",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "user_Id",
              foreignField: "_id",
              as: "viewer",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    name: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              viewer: {
                $arrayElemAt: ["$viewer", 0],
              },
            },
          },
          {
            $project: {
              _id:1,
              viewer:1,
            }
          }
        ],
      },
    },
    // adding fields
    {
      $addFields: {
        author: {
          $arrayElemAt: ["$author", 0],
        },
        isAuthor: {
          $cond: {
            if: { $in: [req.user?._id, "$author._id"] },
            then: true,
            else: false,
          },
          

        },
        uploadedDate: {
          $toDate: "$createdAt" // Convert the timestamp to a Date object
        },
        
        commentCount: {
          $size: "$comments",
        },
        likeCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.user_Id"] },
            then: true,
            else: false,
          },
        },
        views: {
          $size: "$viewers",
        },
      },
    },
    // projection
    {
      $project: {
        author: 1,
        isAuthor: 1,
        videoFile:1,
        thumbnail: 1,
        title: 1,
        description: 1,
        durations: 1,
        comment: 1,
        commentCount: 1,
        likeCount: 1,
        isLiked: 1,
        likes: 1,
        views: 1,
        viewers: 1,
        uploadedDate:1
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(200, videoData, "Course all deta fetched successfully")
    );
});




export { 
  addVideo, 
  getVideo, 
  updateVideoId,
  updateTitle, 
  updateDescription, 
  updateThumbnail,
  updateVisibility,
  publishVideo,
  unpublishVideo,

  deleteVideo,
  

  getVideoData,
};
