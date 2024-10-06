import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteCloudinaryFile,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";
import { Follow } from "../models/follow.model.js";
import mongoose from "mongoose";
import {sendResetEmail, sendVerificationEmail} from "../helpers/mailer.js"
import { UUID } from "mongodb";


const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.accessToken = accessToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};
const generateUsername = async (proposedName) => {
  proposedName = proposedName;

  return User.findOne({ username: proposedName })
    .then(function (account) {
      if (account != null) {
        proposedName += Math.floor(Math.random() * 100 + 1);
        generateUsername(proposedName);
      }
      return proposedName;
    })
    .catch(function (err) {
      throw err;
    });
};
const getUserName = asyncHandler(async (req, res) => {
  const { username } = req.query;
  

  const userName = await generateUsername(username);
  if(username !== userName){
    return res
    .status(201)
    .json(new ApiResponse(200, {username:userName}, "Username is unavailable"));
  }else{
      return res
    .status(201)
    .json(new ApiResponse(200, "", "Username is available"));
  }

});
const registerUser = asyncHandler(async (req, res) => {
  
  const { name, email, password, username } = req.body;
  console.log({ name, email, password, username });
  if (
    [name, email, password, username].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = await User.findOne({
    $or:[{username},{email}],
    isVerified: true,
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }
  const existingVerifiedUserByUsername = await User.findOne({
    username
  });
  if (existingVerifiedUserByUsername) {
    throw new ApiError(409, "Username already taken");
  }
  const existingUserByEmail = await User.findOne({
    email
  });
  
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      
      if (existingUserByEmail.isVerified) {
        return res.status(201)
        .json(new ApiResponse(200, existingUserByEmail, "User Allready registered with this email"));
      } else {
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 360000);
        const user = await existingUserByEmail.save();
        const createdUser = await User.findById(user._id).select(
          "-password -refreshToken"
        );
        const emailResponse = await sendVerificationEmail(
          { email,
           username:createdUser.username,
           verifyCode
         }
         );
         if (!emailResponse) {
                   console.log(emailResponse);
         }
         return res
             .status(201)
             .json(new ApiResponse(200, createdUser, "User already registered. Please verify your account."));
         
      }
    }else{
      console.log("test 2")
      const user = await User.create({
        name,
        email,
        username,
        password,
        verifyCode :verifyCode,
       verifyCodeExpiry : new Date(Date.now() + 360000),
      });
      console.log("test 3");
      const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );
    
      if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
      }
      const emailResponse = await sendVerificationEmail(
        { email,
         username: createdUser.username,
         verifyCode
       }
       );
       if (!emailResponse) {
          console.log(emailResponse);
          createdUser.deleteOne();
       }
       return res
           .status(201)
           .json(new ApiResponse(200, createdUser, "User registerd successfully. Please verify your account."));
       

    }
    
    
 });
  
const registerWithSocial= asyncHandler(async(req, res)=>{
  const { name, email,  username , avatar, isVerified} = req.body;
  console.log({ name, email, password, username });
  if (
    [name, email].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = await User.findOne({
    email,
    isVerified: true,
  });

  if (existingUser) {
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      existingUser._id
    );
    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: existingUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
  }
  const existingVerifiedUserByUsername = await User.findOne({
    username
  });
  let uName;
  if (existingVerifiedUserByUsername) {
    uName = generateUsername(username) 
  }
 
  const user = await User.create({
    name,
    username: uName,
    email,
    avatar:{
      url: avatar
    },
    isVerified:true,
    password : UUID().toString(),
  })

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  )
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      { user: loggedInUser, accessToken, refreshToken },
      "User logged in successfully"
    )
  );

})

const resendCode = asyncHandler(async(req,res)=>{
  const {username} = req.body;
  const user = await User.findOne({username});
  if(!user){
    throw new ApiError(404, "User does not exist");
  }
  if(user.isVerified){
    throw new ApiError(409, "User is already verified");
  }
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verifyCode = verifyCode;
  user.verifyCodeExpiry = new Date(Date.now() + 360000);
  await user.save();
  const emailResponse = await sendVerificationEmail(
    { email,
     username: user.username,
     verifyCode
   }
   );
   if (!emailResponse) {
             console.log(emailResponse);
   }
   return res
       .status(201)
       .json(new ApiResponse(201,"" , "Verification code sent to your email "));
})

const verifyCode = asyncHandler(async(req, res)=>{
  const {username, code} = req.body;
  
  const user = await User.findOne({username});
  if(!user){
    throw new ApiError(404, "User does not exist");
  }
  if(user.isVerified){
    throw new ApiError(409, "User is already verified");
  }
  if(user.verifyCode!== code){
    throw new ApiError(401, "Invalid verification code");
  }
  if(user.verifyCodeExpiry <  Date.now() ){
    throw new ApiError(401, "Verification code has expired");
  }
  user.isVerified = true;
  await user.save();
  const verifiedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log(verifiedUser)
  return res
            .status(200)
            .json(new ApiResponse(200, verifiedUser, "User verified successfully"));
  
})


const loginUser = asyncHandler(async (req, res) => {
  
  // get user details from frontend
  // validation - not empty
  // get user
  // check password
  // generate refresh token
  // send cookie

  const { identifier, password } = req.body;
  if (!identifier && !password) {
  throw new ApiError(400, "All fields are required");
  }
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
   
  }
  if(!user.isVerified){
      throw new ApiError(401, "User is not verified");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password "
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser },
        "User logged in successfully"
      )
    );
});

const requestResetPassword = asyncHandler(async (req, res) => {
  
  // get user details from frontend
  // validation - not empty
  // get user
  // check password
  // generate refresh token
  // send cookie

  const { identifier } = req.body;
  if (!identifier && !password) {
  throw new ApiError(400, "Username or Email are required");
  }
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });
  if (!user) {
    throw new ApiError(404, "Invalid username or email");
  
  }
  if(!user.isVerified){
      throw new ApiError(401, "User is not verified");
  }

  const resetToken = await user.generateResetToken();
  user.resetToken = resetToken
  user.resetTokenExpiry = Date.now() + 1000 * 60 * 5; // 5 minutes
  await user.save();
  
  const emailResponse = await sendResetEmail(
    { email:user.email,
     username: user.username,
     resetToken
   }
   );
   if (!emailResponse) {
      console.log(emailResponse);
   }


  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "",
        `We sent an email to ${user.email} with a link to get back into your account.`
      )
    );
});

const resetPassword = asyncHandler(async (req, res) => {

  const { password,password1, resetToken } = req.body;
  const user = await User.findOne({ resetToken });

  if (!user) {
    throw new ApiError(404, "Invalid reset token");
  }
  if(user.resetTokenExpiry <  Date.now() ){
    throw new ApiError(401, "Reset token has expired");
  }
  if(password!== password1){
    throw new ApiError(400, "Passwords do not match");
  }

  user.password = password
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();


  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Your password has been reset successfully. You can now log in with your new password.")
    )
})

const logOutUser = asyncHandler(async (req, res) => {
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      
        refreshToken: undefined,
        accessToken: undefined,
      
    }
    
  );
  
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  return res
    .status(200)
    .json(new ApiResponse(200, users, "All users is fetched successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  console.log(incomingRefreshToken)
  console.log("request received")

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = Jwt.verify(
      incomingRefreshToken,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresf token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );
    
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken)
      .json(
        new ApiResponse(
          200,
          { user: user, accessToken, refreshToken },
          "Accesstoken token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { name, mobileNumber, username, about ,avatar} = req.body;
  if (
    [name,  username].some((field) => {
      field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const data = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        name: name,
        mobileNumber,
        username,
        about,
        
      },
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  console.log(req.file)
  if (!avatarLocalPath) {
    throw new ApiError(404, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(404, "error while uploading avatar");
  }
  if (req.user.avatar) {
    await deleteCloudinaryFile(req.user.avatar);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.public_id,
      },
    },
    { new: true }
  ).select("-password ");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(404, "coverImage file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(500, "error while uploading coverImage");
  }

  if (req.user.coverImage) {
    await deleteCloudinaryFile(req.user.coverImage);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.public_id,
      },
    },
    { new: true }
  ).select("-password ");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});


const getUserProfile = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(400, "_id is missing");
  }

  try {
    const profile = await User.aggregate(
      [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(_id),
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "follower",
          as: "followings",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "following",
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
                from: "follows",
                localField: "follower",
                foreignField: "following",
                as: "follower",
                pipeline: [
                  {
                    $project: {
                      following: 1,
                      follower: 1,
                    },
                  },
                ],
              },
            },
            {
              $lookup: {
                from: "follows",
                localField: "follower",
                foreignField: "follower",
                as: "following",
                pipeline: [
                  {
                    $project: {
                      following: 1,
                      follower: 1,
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

                isFollowingToMe: {
                  $cond: {
                    if: { $in: [req.user?._id, "$following.following"] },
                    then: true,
                    else: false,
                  },
                },
                isIamFollowing: {
                  $cond: {
                    if: { $in: [req.user?._id, "$follower.follower"] },
                    then: true,
                    else: false,
                  },
                },
               
              },
            },
            {
              $project: {
                _id: 1,
                author: 1,
                isFollowingToMe: 1,
                isIamFollowing: 1,
                following:1,
                follower:1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "following",
          as: "followers",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "follower",
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
                from: "follows",
                localField: "follower",
                foreignField: "following",
                as: "follower",
                pipeline: [
                  {
                    $project: {
                      following: 1,
                      follower: 1,
                    },
                  },
                ],
              },
            },
            {
              $lookup: {
                from: "follows",
                localField: "follower",
                foreignField: "follower",
                as: "following",
                pipeline: [
                  {
                    $project: {
                      following: 1,
                      follower: 1,
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
                isFollowingToMe: {
                  $cond: {
                    if: { $in: [req.user?._id, "$following.following"] },
                    then: true,
                    else: false,
                  },
                },
                isIamFollowing: {
                  $cond: {
                    if: { $in: [req.user?._id, "$follower.follower"] },
                    then: true,
                    else: false,
                  },
                },
               
              },
            },
            {
              $project: {
                _id: 1,
                author: 1,
                isFollowingToMe: 1,
                isIamFollowing: 1,
                following:1,
                follower:1,
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "author",
          as: "blogposts",
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
          followersCount: {
            $size: "$followers",
          },
          followingsCount: {
            $size: "$followings",
          },
          isFollowing: {
            $cond: {
              if: { $in: [req.user?._id, "$followers.follower"] },
              then: true,
              else: false,
            },
          },
          postCount: {
            $size: "$blogposts",
          },
          isAuthor: {
            $cond: {
              if: { $eq: ["$_id", req.user?._id] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          username: 1,
          name: 1,
          email: 1,
          avatar: 1,
          coverImage: 1,
          blogposts: 1,
          followers: 1,
          followings: 1,
          isFollowing: 1,
          isAuthor: 1,
          followersCount: 1,
          followingsCount: 1,
          postCount: 1,
        },
      },
    ]
  );
    if (!profile.length) {
      throw new ApiError(404, "Profile does not exist");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, profile, "User fetched successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});
const getUserAccount = asyncHandler(async (req, res) => {
  const { _id } = req.params;
  if (!_id) {
    throw new ApiError(400, "_id is missing");
  }
  const userAccount = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $lookup: {
        from: "useraddresses",
        localField: "_id",
        foreignField: "user_Id",
        as: "address",
      },
    },
    {
      $lookup: {
        from: "qualifications",
        localField: "_id",
        foreignField: "user_Id",
        as: "qualifications",
      },
    },
    // {
    //   $lookup: {
    //     from: "results",
    //     localField: "_id",
    //     foreignField: "user_Id",
    //     as: "results",
    //   },
    // },
    {
      $lookup: {
        from: "personaldetails",
        localField: "_id",
        foreignField: "user_Id",
        as: "personaldetails",
      },
    },
    {
      $project: {
        username: 1,
        name: 1,
        mobileNumber: 1,
        email: 1,
        about: 1,
        DateofBirth: 1,
        avatar: 1,
        coverImage: 1,
        address: 1,
        qualifications: 1,
        // results: 1,
        personaldetails: 1,
      },
    },
    {
      $addFields: {
        personaldetails: {
          $arrayElemAt: ["$personaldetails", 0],
        },
        address: {
          $arrayElemAt: ["$address", 0],
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, userAccount, "User fetched successfully"));
});

const followToNewUser = asyncHandler(async (req, res) => {
  const { following } = req.body;
  const check = await Follow.findOneAndDelete({
    follower: req.user._id,
    following,
  });
  if (check?.follower) {
    return res.status(200).json(new ApiResponse(200, "", "Unfollowing to "));
  }
  const follow = await Follow.create({
    follower: req.user._id,
    following,
  });
  return res.status(200).json(new ApiResponse(200, follow, "Following to "));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "author",
              foreignField: "_id",
              as: "author",
              pipeline: [
                {
                  $project: {
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
    {},
  ]);

  return res
    .status(200)
    .json(200, user[0].watchHistory, "watchHistory fetched successfully");
});

export {
  getUserName,
  registerUser,
  registerWithSocial,
  resendCode,
  verifyCode,
  loginUser,
  logOutUser,
  requestResetPassword,
  resetPassword,
  getAllUsers,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  getUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserProfile,
  getUserAccount,
  followToNewUser,
  getWatchHistory,
};
