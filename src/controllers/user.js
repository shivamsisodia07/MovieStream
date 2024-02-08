import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshToken = async (user_id) => {
  try {
    const user = User.findById(user_id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
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
  .cokkies("accessToken",accessToken,options)
  .cookies("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser,accessToken,refreshToken

        },
        "user logged in successfully"
    )
  )
});
const LogOutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },{
            new:true
        });
        const options = {
            httpOnly: true,
            secure: true,
          };

          return res
          .status(200)
          .clearCookie("accessToken",options)
          .clearCookie("refreshToken",options)
          .json(
            new ApiResponse(
                200,
                {

                },
                "user logged out successfully!!"
            )
          )
});
//http://localhost:8000/api/v1/users/register
export {RegisterUser,LoginUser,LogOutUser};
