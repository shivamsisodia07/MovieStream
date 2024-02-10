import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { verifyJwt } from "../middlewares/auth.js";
import { application } from "express";

const generateAccessAndRefreshToken = async (user_id) => {
  try {
    const user = await User.findById(user_id);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    // console.log(user);
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError("Something went wrong while generating tokens");
  }
};

const RegisterUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //     message:"Ok"
  // })
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res
  const { email, fullName, password, userName } = req.body;
  // console.log("email:" +email);
  // console.log("fullname:" +fullName);
  // console.log("password:" +password);
  // console.log("username:" +userName);

  if (
    [email, userName, password, fullName].some((feild) => feild?.trim() === "")
  ) {
    console.log(error);
    throw new ApiError(400, "All feilds are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const LoginUser = asyncHandler(async (req, res) => {
  /*
      1. req.body -> email or username(for instagram like application),password,access token
      2. validate the access token
      3. validate the password and email
      4. refresh token from db

    */
  const { email, userName, password } = req.body;
  console.log(req.body);
  if (!userName || !email) {
    throw new ApiError(400, "username or email is required!!");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(401, "user doesn't exits!!");
  }
  // console.log(user);
  const ValidatePassword = await user.isPasswordCorrect(password);

  if (!ValidatePassword) {
    throw new ApiError(401, "Invalid user credentails!!");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "--password --refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const LogOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
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
    .json(new ApiResponse(200, {}, "user logged out successfully!!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = JWT.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new ApiError(401, "unauthorized request");
    }

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "unauthorized refresh");
    }

    if (user.refreshToken !== incomingToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            newRefreshToken,
            accessToken,
          },
          "access token is refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "something went wrong while refreshing token");
  }
});

const ChangePassword = asyncHandler(async (req, res) => {
  const { confirmPassword, oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  if (oldPassword !== confirmPassword) {
    throw new ApiError(400, "confirmPassword and New Password didn't match");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "wrong old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updateDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "all field is required!!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("--password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "wrong avatar path");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "error while avatar update");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("--password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "wrong coverImage path");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "error while Cover Image update");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("--password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params;

    if(!username?.trim()){
      throw new ApiError(400,"username is missing");
    }

    const channel=await User.aggregate([
       { 
        $match:{
          username:username?.toLowerCase();
        }
      },
      {
        $lookup:{
          from:"subscription",
          localField:"_id",
          foreignField:"channel",
          as:"subscribers"
        }
        },
        {
          $lookup:{
            from:"subscription",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscriberTo"
          }
        },
        {
          $addFields:{
            subscribersCount:{
              $size:"$subscribers"
            },
            channelSubscribedToCount:{
              $size:"$subscriberTo"
            },
            isSubscribed:{
              $cond:{
                if:{$in:[req.user?._id,"$subscribers.subscriber"]}
                ,then:true,
                else:false
              }
            }
          }

        },
        {
          $project:{
            fullName:1,
            email:1,
            userName:1,
            subscribersCount:1,
            channelSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
          }
        }

      ])

      if(!channel?.length){
        throw new ApiError(400,"channel does not exists");
      }

      return res
      .status(200)
      .json(new ApiResponse(200,channel[0],"User channel fetched successfully"));
})



//http://localhost:8000/api/v1/users/register
export {
  RegisterUser,
  LoginUser,
  LogOutUser,
  refreshAccessToken,
  getCurrentUser,
  ChangePassword,
  updateDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
};
