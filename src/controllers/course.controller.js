import mongoose from "mongoose";
import { Course } from "../models/course.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import {
  deleteCloudinaryFile,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";



const addCourse = asyncHandler(async (req, res) => {
  const author = req.user._id;
  const { title } = req.body;
  console.log(author, title);

  if (!author) throw new ApiError(404, "Author Id is required");
  if (!title) throw new ApiError(404, "Title is required");

  const course = await Course.create({
    author,
    title,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course added successfully"));
});

const updateCourse = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  const {
    public_id,
    secure_url,
    title,
    description,
    language,
    isPublished,
    actualPrice,
    discountPrice,
    startOn,
    endOn,
  } = req.body;
  console.log({
    title,
    description,
    language,
    isPublished,
    actualPrice,
    discountPrice,
    startOn,
    endOn,
  });
  if (
    [
      title,
      description,
      language,
      isPublished,
      actualPrice,
      discountPrice,
      startOn,
      endOn,
    ].some((val) => {
      val.trim() === "";
    })
  ) {
    throw new ApiError(404, "All fields are required");
  }
  const discount = Math.floor(
    ((actualPrice - discountPrice) / actualPrice) * 100 || 0
  );

  const thumbnailFilePath = req.file?.path;
  let thumbnailFile;
  if (thumbnailFilePath) {
    thumbnailFile = await uploadOnCloudinary(thumbnailFilePath);
  }
  if (thumbnailFile) {
    await deleteCloudinaryFile(public_id);
  }

  const course = await Course.findByIdAndUpdate(_id, {
    author: req.user._id,
    thumbnail: {
      public_id: thumbnailFile ? thumbnailFile?.public_id : public_id,
      secure_url: thumbnailFile ? thumbnailFile?.secure_url : secure_url,
    },
    title,
    description,
    language,
    isPublished,
    actualPrice,
    discountPrice,
    discount,
    startOn,
    endOn,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course is updated successfully"));
});

const updateTitle = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { title } = req.body;
  if (!_id || !title) {
    throw new ApiError(404, "Course Id and Title are required");
  }
  const course = await Course.findByIdAndUpdate(_id, {
    $set: {
      title,
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course title is updated successfully"));
});

const updateDescription = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { description } = req.body;
  if (!_id || !description) {
    throw new ApiError(404, "Course Id and Description are required");
  }
  const course = await Course.findByIdAndUpdate(_id, {
    $set: {
      description,
    },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, course, "Course description is updated successfully")
    );
});

const updateLanguage = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { language } = req.body;
  if (!_id || !language) {
    throw new ApiError(404, "Course Id and Language are required");
  }
  const course = await Course.findByIdAndUpdate(_id, {
    $set: {
      language,
    },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, course, "Course language is updated successfully")
    );
});

const updateActualPrice = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  console.log(_id);
  const { printPrice, discount } = req.body;
  if (!_id || !(printPrice >= 0) || !(discount >= 0)) {
    throw new ApiError(404, "Course Id and Print Price are required");
  }
  const sellingPrice = Math.floor(printPrice - (printPrice * discount) / 100);
  const course = await Course.findByIdAndUpdate(_id, {
    $set: {
      printPrice,
      discount,
      sellingPrice,
    },
  });
  console.log(res);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        course,
        "Course actual price is updated successfully"
      )
    );
});

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

  if(!thumbnailFile) throw new ApiError(500, "Thumbnail Upload faild ")

  const course = await Course.findById(_id);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Delete old thumbnail from cloudinary

  if (course.thumbnail) {
    await deleteCloudinaryFile(course.thumbnail.public_id);
  }

  course.thumbnail.public_id = thumbnailFile?.public_id;
  course.thumbnail.secure_url = thumbnailFile?.secure_url;

  const newCourse = await course.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, newCourse, "Course thumbnail is updated successfully")
    );
});

const updateDuration = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  const { from, to } = req.body;
  if (!_id || !from || !to) {
    throw new ApiError(404, "Course Id  and Duration are required ");
  }
  console.log(from, to);
  const course = await Course.findByIdAndUpdate(_id, {
    $set: {
      from,
      to,
    },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, course, "Course duration is updated successfully")
    );
});

const publishCourse = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    throw new ApiError(404, "Course Id is required");
  }
  const validatedCourse = await Course.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "course_id",
        as: "chapters",
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "course_id",
        as: "publishedChapters",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "course_id",
              as: "videos",
            },
          },

          {
            $project: {
              videos: 1,
            },
          },
        ],
      },
    },

    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        language: 1,
        isPublished: 1,
        printPrice: 1,
        sellingPrice: 1,
        discount: 1,
        thumbnail: 1,
        chapters: 1,
        publishedChapters: 1,
      },
    },
  ]);
  // console.log(validatedCourse[0])
  if (!validatedCourse[0]?.title || !validatedCourse[0]?.description) {
    throw new ApiError(404, "All fields are required");
  }
  if (!validatedCourse[0]?.thumbnail?.secure_url) {
    throw new ApiError(404, "Thumbnail is required");
  }
  if (!validatedCourse[0]?.language) {
    throw new ApiError(404, "Language is required");
  }
  if (
    !validatedCourse[0]?.discount ||
    validatedCourse[0]?.discount < 0 ||
    validatedCourse[0]?.discount > 100
  ) {
    throw new ApiError(404, "Discount should be between 0 and 100");
  }
  if (
    !validatedCourse[0]?.printPrice ||
    !validatedCourse[0]?.sellingPrice ||
    validatedCourse[0]?.sellingPrice > validatedCourse[0]?.printPrice
  ) {
    throw new ApiError(404, "Selling price should be less than print price");
  }

  if (!validatedCourse[0]?.chapters) {
    throw new ApiError(404, "Please add at least one chapter should be add");
  }
  if (!validatedCourse[0]?.publishedChapters?.length) {
    throw new ApiError(
      404,
      "Please publish at least one chapter should be add"
    );
  }

  const course = await Course.findByIdAndUpdate(_id, {
    $set: {
      isPublished: true,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course is published successfully"));
});

const removeCourse = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(404, "Course Id is required");
  }
  const course = await Course.findById(_id);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }
  if (course?.thumbnail?.public_id) {
    deleteCloudinaryFile(course?.thumbnail?.public_id);
  }
  const courseStatus = await Course.findByIdAndDelete(_id);
  return res
    .status(200)
    .json(new ApiResponse(200, courseStatus, "Course is removed successfully"));
});

const getData = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(404, "Course Id is required");
  }
  // const course = await Course.findById(_id);
  const course = await Course.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $unwind: "$chapters",
    },
    {
      $lookup: {
        from: "videos",
        localField: "chapters._id",
        foreignField: "_id",
        as: "videoItem",
      },
    },
    {
      $unwind: "$videoItem",
    },
    {
      $addFields: {
        "chapters._id": "$videoItem._id",
        "chapters.title": "$videoItem.title",
        "chapters.isPublished": "$videoItem.isPublished",
        "chapters.isFree": "$videoItem.isFree",
      },
    },
    {
      $group: {
        _id: "$_id",
        chapters: { $push: "$chapters" },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        language: 1,
        chapters: 1,
        chapter: 1,
        printPrice: 1,
        discount: 1,
        sellingPrice: 1,
        from: 1,
        to: 1,
      },
    },
  ]);
  console.log(course);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course is fetched successfully"));
});

const getAllCourses = asyncHandler(async (req, res) => {
  const course = await Course.find({ isPublished: true }).select("_id");

  if (!course) {
    throw new ApiError(404, "Course not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course is fetched successfully"));
});

const getAdminCourses = asyncHandler(async (req, res) => {
  // const count = await Course.countDocuments(query);

  const course = await Course.find({ author: req.user });

  console.log(course);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course is fetched successfully"));
});

const getPublishedCoursesData = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  try {
    const courseData = await Course.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(_id),
          isPublished: true,
        },
      },

      // Getting author of the course
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

      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "course_id",
          as: "chapters",
          pipeline: [
            {
              $match: {
                isPublished: true,
              },
            },
            {
              $addFields: {
                isFree: {
                  $cond: {
                    if: { $eq: ["$isFree", "free"] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                isFree: 1,
                title: 1,
                isPublished: 1,
              },
            },
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
          chapterCount: {
            $size: "$chapters",
          },
          isFree: {
            $cond: {
              if: { $eq: ["$printPrice", 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      // projection
      {
        $project: {
          author: 1,
          isAuthor: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          language: 1,
          isPublished: 1,
          printPrice: 1,
          sellingPrice: 1,
          discount: 1,
          chapterCount: 1,
          isFree: 1,
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(200, courseData, "Course all deta fetched successfully")
      );
  } catch (error) {
    console.log(error);
  }
});

const getCourseData = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    throw new ApiError(404, "Course Id is required");
  }
  try {
    const courseData = await Course.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(_id),
        },
      },

      // Free videos
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "course_id",
          as: "freeChapters",
          pipeline: [
            {
              $match: {
                isFree: "free",
              },
            },
            {
              $addFields: {
                isFree: {
                  $cond: {
                    if: { $eq: ["$isFree", "free"] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                videoId: 1,
                isFree: 1,
                title: 1,
                isPublished: 1,
                thumbnail: 1,
              },
            },
          ],
        },
      },
      // all videos
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "course_id",
          as: "chapters",
          pipeline: [
            {
              $match: {
                isPublished: true,
              },
            },
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
            // getting views
            {
              $lookup: {
                from: "views",
                localField: "_id",
                foreignField: "course_Id",
                as: "viewers",
                pipeline: [
                  {
                    $lookup: {
                      from: "users",
                      localField: "user_Id",
                      foreignField: "_id",
                      as: "userData",
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
                      _id: 1,
                      viewer: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                isFree: {
                  $cond: {
                    if: { $eq: ["$isFree", "free"] },
                    then: true,
                    else: false,
                  },
                },
                channelName: {
                  $arrayElemAt: ["$author.name", 0],
                },
                views:{
                  $size: "$viewers",
                },
                uploadedDate: {
                  $toDate: "$createdAt" // Convert the timestamp to a Date object
                }
              },
            },
            {
              $project: {
                _id: 1,
                videoId: 1,
                isFree: 1,
                title: 1,
                isPublished: 1,
                thumbnail: 1,
                channelName: 1,
                views: 1,
                uploadedDate:1,
              },
            },
          ],
        },
      },

      // Getting author of the course
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
      // getting enrolled student
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "course_Id",
          as: "enrolledStudent",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "sender_Id",
                foreignField: "_id",
                as: "studentData",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                studentData: {
                  $arrayElemAt: ["$studentData", 0],
                },
              },
            },
            {
              $project: {
                studentData: 1,
                isEnrolled: 1,
              },
            },
          ],
        },
      },
      // getting feedback about courses
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "course_Id",
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
          foreignField: "course_Id",
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
          foreignField: "course_Id",
          as: "viewers",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "user_Id",
                foreignField: "_id",
                as: "userData",
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
                _id: 1,
                viewer: 1,
              },
            },
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
          enrolledStudentCount: {
            $size: "$enrolledStudent",
          },
          isEnrolled: {
            $cond: {
              if: { $in: [req.user?._id, "$enrolledStudent.studentData._id"] },
              then: true,
              else: false,
            },
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
          thumbnail: 1,
          title: 1,
          description: 1,
          language: 1,
          from: 1,
          to: 1,
          isPublished: 1,
          printPrice: 1,
          sellingPrice: 1,
          discount: 1,
          enrolledStudentCount: 1,
          enrolledStudent: 1,
          isEnrolled: 1,
          comments: 1,
          commentCount: 1,
          likeCount: 1,
          isLiked: 1,
          likes: 1,
          views: 1,
          viewers: 1,
          freeChapters: 1,
          chapters: 1,
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(200, courseData, "Course all deta fetched successfully")
      );
  } catch (error) {
    console.log(error);
  }
});

const getEditCourseData = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  if (!_id) {
    throw new ApiError(404, "Course Id is required");
  }
  try {
    const courseData = await Course.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(_id),
        },
      },

      // Free videos
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "course_id",
          as: "freeChapters",
          pipeline: [
            {
              $match: {
                isFree: "free",
              },
            },
            {
              $addFields: {
                isFree: {
                  $cond: {
                    if: { $eq: ["$isFree", "free"] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                isFree: 1,
              },
            },
          ],
        },
      },
      // all videos
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "course_id",
          as: "chapters",
          pipeline: [
            {
              $addFields: {
                isFree: {
                  $cond: {
                    if: { $eq: ["$isFree", "free"] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                isFree: 1,
                title: 1,
                isPublished: 1,
              },
            },
          ],
        },
      },

      // projection
      {
        $project: {
          author: 1,
          isAuthor: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          language: 1,
          from: 1,
          to: 1,
          isPublished: 1,
          printPrice: 1,
          sellingPrice: 1,
          discount: 1,
          enrolledStudentCount: 1,
          enrolledStudent: 1,
          isEnrolled: 1,
          comments: 1,
          commentCount: 1,
          likeCount: 1,
          isLiked: 1,
          likes: 1,
          views: 1,
          viewers: 1,
          freeChapters: 1,
          chapters: 1,
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(200, courseData, "Course all deta fetched successfully")
      );
  } catch (error) {
    console.log(error);
  }
});

const orderSummary = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(404, "Course not found");
  }
  const order = await Course.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      },
    },
    // Getting author of the course
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
              name: 1,
            },
          },
        ],
      },
    },
    // getting enrolled student
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "course_Id",
        as: "enrolledStudent",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "sender_Id",
              foreignField: "_id",
              as: "studentData",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              studentData: {
                $arrayElemAt: ["$studentData", 0],
              },
              isEnrolled: {
                $cond: {
                  if: { $in: [req.user?._id, "$studentData._id"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              studentData: 1,
              isEnrolled: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        isEnrolled: {
          $cond: {
            if: { $in: [req.user?._id, "$enrolledStudent.studentData._id"] },
            then: true,
            else: false,
          },
        },
        isAuther: {
          $cond: {
            if: { $in: [req.user?._id, "$author._id"] },
            then: true,
            else: false,
          },
        },
      },
    },

    {
      $project: {
        isAuthor: 1,
        thumbnail: 1,
        title: 1,
        actualPrice: 1,
        discountPrice: 1,
        discount: 1,
        enrolledStudent: 1,
        isEnrolled: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, order, "Course all deta fetched successfully"));
});

const getFreeVideos = asyncHandler(async () => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(404, "Course not found");
  }
  const videos = await Course.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "course_id",
        as: "videos",
        pipeline: [
          {
            $match: {
              isFree: "free",
            },
          },
          // // getting likes
          // {
          //   $lookup: {
          //     from: "likes",
          //     localField: "_id",
          //     foreignField: "video_Id",
          //     as: "likes",
          //     pipeline: [
          //       {
          //         $lookup: {
          //           from: "users",
          //           localField: "user_Id",
          //           foreignField: "_id",
          //           as: "author",
          //           pipeline: [
          //             {
          //               $project: {
          //                 _id: 1,
          //                 username: 1,
          //                 name: 1,
          //                 avatar: 1,
          //               },
          //             },
          //           ],
          //         },
          //       },

          //       {
          //         $addFields: {
          //           author: {
          //             $arrayElemAt: ["$author", 0],
          //           },
          //         },
          //       },
          //     ],
          //   },
          // },
          // // getting views
          // {
          //   $lookup: {
          //     from: "views",
          //     localField: "_id",
          //     foreignField: "video_Id",
          //     as: "viewers",
          //     pipeline: [
          //       {
          //         $lookup: {
          //           from: "users",
          //           localField: "user_Id",
          //           foreignField: "_id",
          //           as: "viewer",
          //           pipeline: [
          //             {
          //               $project: {
          //                 _id: 1,
          //                 username: 1,
          //                 name: 1,
          //                 avatar: 1,
          //               },
          //             },
          //           ],
          //         },
          //       },
          //       {
          //         $addFields: {
          //           viewer: {
          //             $arrayElemAt: ["$viewer", 0],
          //           },
          //         },
          //       },
          //       {
          //         $project: {
          //           _id: 1,
          //           viewer: 1,
          //         },
          //       },
          //     ],
          //   },
          // },
          // // getting comments
          // {
          //   $lookup: {
          //     from: "comments",
          //     localField: "_id",
          //     foreignField: "video_Id",
          //     as: "comments",
          //     pipeline: [
          //       // Lookup for comment author
          //       {
          //         $lookup: {
          //           from: "users",
          //           localField: "user_Id",
          //           foreignField: "_id",
          //           as: "author",
          //           pipeline: [
          //             {
          //               $project: {
          //                 _id: 1,
          //                 username: 1,
          //                 name: 1,
          //                 avatar: 1,
          //               },
          //             },
          //           ],
          //         },
          //       },
          //       // lookup for comments reply
          //       {
          //         $lookup: {
          //           from: "comments",
          //           localField: "_id",
          //           foreignField: "comment_Id",
          //           as: "commentsReply",

          //           pipeline: [
          //             // lookup for author of coments reply
          //             {
          //               $lookup: {
          //                 from: "users",
          //                 localField: "user_Id",
          //                 foreignField: "_id",
          //                 as: "author",
          //                 pipeline: [
          //                   {
          //                     $project: {
          //                       _id: 1,
          //                       username: 1,
          //                       name: 1,
          //                       avatar: 1,
          //                     },
          //                   },
          //                 ],
          //               },
          //             },
          //             // lookup for likes of comment reply
          //             {
          //               $lookup: {
          //                 from: "likes",
          //                 localField: "_id",
          //                 foreignField: "comment_Id",
          //                 as: "likes",
          //                 pipeline: [
          //                   {
          //                     $lookup: {
          //                       from: "users",
          //                       localField: "user_Id",
          //                       foreignField: "_id",
          //                       as: "author",
          //                       pipeline: [
          //                         {
          //                           $project: {
          //                             _id: 1,
          //                             username: 1,
          //                             name: 1,
          //                             avatar: 1,
          //                           },
          //                         },
          //                       ],
          //                     },
          //                   },

          //                   {
          //                     $addFields: {
          //                       author: {
          //                         $arrayElemAt: ["$author", 0],
          //                       },
          //                     },
          //                   },
          //                 ],
          //               },
          //             },
          //             // add fields in comments reply
          //             {
          //               $addFields: {
          //                 author: {
          //                   $arrayElemAt: ["$author", 0],
          //                 },
          //                 isAuthor: {
          //                   $cond: {
          //                     if: { $in: [req.user?._id, "$author._id"] },
          //                     then: true,
          //                     else: false,
          //                   },
          //                 },

          //                 likeCount: {
          //                   $size: "$likes",
          //                 },
          //                 isLiked: {
          //                   $cond: {
          //                     if: { $in: [req.user?._id, "$likes.user_Id"] },
          //                     then: true,
          //                     else: false,
          //                   },
          //                 },
          //               },
          //             },
          //             // projection of comment reply
          //             {
          //               $project: {
          //                 _id: 1,
          //                 author: 1,
          //                 isAuthor: 1,
          //                 createdAt: 1,
          //                 likeCount: 1,
          //                 isLiked: 1,
          //                 likes: 1,
          //                 comment: 1,
          //               },
          //             },
          //           ],
          //         },
          //       },
          //       // lookup for likes of comments
          //       {
          //         $lookup: {
          //           from: "likes",
          //           localField: "_id",
          //           foreignField: "comment_Id",
          //           as: "likes",
          //           pipeline: [
          //             {
          //               $lookup: {
          //                 from: "users",
          //                 localField: "user_Id",
          //                 foreignField: "_id",
          //                 as: "author",
          //                 pipeline: [
          //                   {
          //                     $project: {
          //                       _id: 1,
          //                       username: 1,
          //                       name: 1,
          //                       avatar: 1,
          //                     },
          //                   },
          //                 ],
          //               },
          //             },

          //             {
          //               $addFields: {
          //                 author: {
          //                   $arrayElemAt: ["$author", 0],
          //                 },
          //               },
          //             },
          //           ],
          //         },
          //       },
          //       // add fields in comment
          //       {
          //         $addFields: {
          //           author: {
          //             $arrayElemAt: ["$author", 0],
          //           },
          //           isAuthor: {
          //             $cond: {
          //               if: { $in: [req.user?._id, "$author._id"] },
          //               then: true,
          //               else: false,
          //             },
          //           },
          //           replyCount: {
          //             $size: "$commentsReply",
          //           },
          //           likeCount: {
          //             $size: "$likes",
          //           },
          //           isLiked: {
          //             $cond: {
          //               if: { $in: [req.user?._id, "$likes.user_Id"] },
          //               then: true,
          //               else: false,
          //             },
          //           },
          //         },
          //       },
          //       // projection in comment
          //       {
          //         $project: {
          //           _id: 1,
          //           author: 1,
          //           isAuthor: 1,
          //           comment: 1,
          //           createdAt: 1,
          //           commentsReply: 1,
          //           replyCount: 1,
          //           likeCount: 1,
          //           isLiked: 1,
          //           likes: 1,
          //         },
          //       },
          //     ],
          //   },
          // },
          // {
          //   $addFields:{
          //     isFree:{
          //       $cond:{
          //         if: { $eq: ["$isFree", "free"] },
          //         then: true,
          //         else: false,
          //       }
          //     }
          //   }
          // },
          {
            $project: {
              _id: 1,
              isFree: 1,
              // author: 1,
              // course_id: 1,
              // createdAt: 1,
              // description: 1,

              // thumbnail: 1,
              // title: 1,
              // videoFile: 1,
              // likes: 1,
              // likeCount: 1,
              // isLiked: 1,
              // comments: 1,
              // commentCount: 1,
              // isAuthor: 1,
            },
          },
        ],
      },
    },
  ]);
  return res.status(200).json(new ApiResponse(200, videos, "Data fetched"));
});

const getAllVideos = asyncHandler(async () => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(404, "Course not found");
  }
  const videos = await Course.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "course_id",
        as: "videos",
        pipeline: [
          // getting likes
          // {
          //   $lookup: {
          //     from: "likes",
          //     localField: "_id",
          //     foreignField: "video_Id",
          //     as: "likes",
          //     pipeline: [
          //       {
          //         $lookup: {
          //           from: "users",
          //           localField: "user_Id",
          //           foreignField: "_id",
          //           as: "author",
          //           pipeline: [
          //             {
          //               $project: {
          //                 _id: 1,
          //                 username: 1,
          //                 name: 1,
          //                 avatar: 1,
          //               },
          //             },
          //           ],
          //         },
          //       },

          //       {
          //         $addFields: {
          //           author: {
          //             $arrayElemAt: ["$author", 0],
          //           },
          //         },
          //       },
          //     ],
          //   },
          // },
          // // getting views
          // {
          //   $lookup: {
          //     from: "views",
          //     localField: "_id",
          //     foreignField: "video_Id",
          //     as: "viewers",
          //     pipeline: [
          //       {
          //         $lookup: {
          //           from: "users",
          //           localField: "user_Id",
          //           foreignField: "_id",
          //           as: "viewer",
          //           pipeline: [
          //             {
          //               $project: {
          //                 _id: 1,
          //                 username: 1,
          //                 name: 1,
          //                 avatar: 1,
          //               },
          //             },
          //           ],
          //         },
          //       },
          //       {
          //         $addFields: {
          //           viewer: {
          //             $arrayElemAt: ["$viewer", 0],
          //           },
          //         },
          //       },
          //       {
          //         $project: {
          //           _id: 1,
          //           viewer: 1,
          //         },
          //       },
          //     ],
          //   },
          // },
          // // getting comments
          // {
          //   $lookup: {
          //     from: "comments",
          //     localField: "_id",
          //     foreignField: "video_Id",
          //     as: "comments",
          //     pipeline: [
          //       // Lookup for comment author
          //       {
          //         $lookup: {
          //           from: "users",
          //           localField: "user_Id",
          //           foreignField: "_id",
          //           as: "author",
          //           pipeline: [
          //             {
          //               $project: {
          //                 _id: 1,
          //                 username: 1,
          //                 name: 1,
          //                 avatar: 1,
          //               },
          //             },
          //           ],
          //         },
          //       },
          //       // lookup for comments reply
          //       {
          //         $lookup: {
          //           from: "comments",
          //           localField: "_id",
          //           foreignField: "comment_Id",
          //           as: "commentsReply",

          //           pipeline: [
          //             // lookup for author of coments reply
          //             {
          //               $lookup: {
          //                 from: "users",
          //                 localField: "user_Id",
          //                 foreignField: "_id",
          //                 as: "author",
          //                 pipeline: [
          //                   {
          //                     $project: {
          //                       _id: 1,
          //                       username: 1,
          //                       name: 1,
          //                       avatar: 1,
          //                     },
          //                   },
          //                 ],
          //               },
          //             },
          //             // lookup for likes of comment reply
          //             {
          //               $lookup: {
          //                 from: "likes",
          //                 localField: "_id",
          //                 foreignField: "comment_Id",
          //                 as: "likes",
          //                 pipeline: [
          //                   {
          //                     $lookup: {
          //                       from: "users",
          //                       localField: "user_Id",
          //                       foreignField: "_id",
          //                       as: "author",
          //                       pipeline: [
          //                         {
          //                           $project: {
          //                             _id: 1,
          //                             username: 1,
          //                             name: 1,
          //                             avatar: 1,
          //                           },
          //                         },
          //                       ],
          //                     },
          //                   },

          //                   {
          //                     $addFields: {
          //                       author: {
          //                         $arrayElemAt: ["$author", 0],
          //                       },
          //                     },
          //                   },
          //                 ],
          //               },
          //             },
          //             // add fields in comments reply
          //             {
          //               $addFields: {
          //                 author: {
          //                   $arrayElemAt: ["$author", 0],
          //                 },
          //                 isAuthor: {
          //                   $cond: {
          //                     if: { $in: [req.user?._id, "$author._id"] },
          //                     then: true,
          //                     else: false,
          //                   },
          //                 },

          //                 likeCount: {
          //                   $size: "$likes",
          //                 },
          //                 isLiked: {
          //                   $cond: {
          //                     if: { $in: [req.user?._id, "$likes.user_Id"] },
          //                     then: true,
          //                     else: false,
          //                   },
          //                 },
          //               },
          //             },
          //             // projection of comment reply
          //             {
          //               $project: {
          //                 _id: 1,
          //                 author: 1,
          //                 isAuthor: 1,
          //                 createdAt: 1,
          //                 likeCount: 1,
          //                 isLiked: 1,
          //                 likes: 1,
          //                 comment: 1,
          //               },
          //             },
          //           ],
          //         },
          //       },
          //       // lookup for likes of comments
          //       {
          //         $lookup: {
          //           from: "likes",
          //           localField: "_id",
          //           foreignField: "comment_Id",
          //           as: "likes",
          //           pipeline: [
          //             {
          //               $lookup: {
          //                 from: "users",
          //                 localField: "user_Id",
          //                 foreignField: "_id",
          //                 as: "author",
          //                 pipeline: [
          //                   {
          //                     $project: {
          //                       _id: 1,
          //                       username: 1,
          //                       name: 1,
          //                       avatar: 1,
          //                     },
          //                   },
          //                 ],
          //               },
          //             },

          //             {
          //               $addFields: {
          //                 author: {
          //                   $arrayElemAt: ["$author", 0],
          //                 },
          //               },
          //             },
          //           ],
          //         },
          //       },
          //       // add fields in comment
          //       {
          //         $addFields: {
          //           author: {
          //             $arrayElemAt: ["$author", 0],
          //           },
          //           isAuthor: {
          //             $cond: {
          //               if: { $in: [req.user?._id, "$author._id"] },
          //               then: true,
          //               else: false,
          //             },
          //           },
          //           replyCount: {
          //             $size: "$commentsReply",
          //           },
          //           likeCount: {
          //             $size: "$likes",
          //           },
          //           isLiked: {
          //             $cond: {
          //               if: { $in: [req.user?._id, "$likes.user_Id"] },
          //               then: true,
          //               else: false,
          //             },
          //           },
          //         },
          //       },
          //       // projection in comment
          //       {
          //         $project: {
          //           _id: 1,
          //           author: 1,
          //           isAuthor: 1,
          //           comment: 1,
          //           createdAt: 1,
          //           commentsReply: 1,
          //           replyCount: 1,
          //           likeCount: 1,
          //           isLiked: 1,
          //           likes: 1,
          //         },
          //       },
          //     ],
          //   },
          // },
          {
            $addFields: {
              isFree: {
                $cond: {
                  if: { $eq: ["$isFree", "free"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              // author: 1,
              // course_id: 1,
              // createdAt: 1,
              // description: 1,
              isFree: 1,
              // thumbnail: 1,
              // title: 1,
              // videoFile: 1,
              // likes: 1,
              // likeCount: 1,
              // isLiked: 1,
              // comments: 1,
              // commentCount: 1,
              // isAuthor: 1,
            },
          },
        ],
      },
    },
  ]);
  return res.status(200).json(new ApiResponse(200, videos, "Data fetched"));
});

const addChapter = asyncHandler(async (req, res, next) => {
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

  next();
});

const reorderChapters = asyncHandler(async (req, res) => {
  const { updateData } = req.body;
  const { _id } = req.params;

  if (!_id || !updateData) {
    throw new ApiError(404, "Course ID and chapters are required");
  }

  const course = await Course.findByIdAndUpdate(
    _id,
    { updateData },
    { new: true }
  );

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, course, "Chapters reordered successfully"));
});

export {
  addCourse,
  updateCourse,
  updateTitle,
  updateDescription,
  updateLanguage,
  updateActualPrice,
  updateThumbnail,
  updateDuration,
  publishCourse,
  removeCourse,
  getData,
  getAllCourses,
  getPublishedCoursesData,
  getAdminCourses,
  getCourseData,
  getEditCourseData,
  orderSummary,
  getAllVideos,
  getFreeVideos,
  addChapter,
  reorderChapters,
};
