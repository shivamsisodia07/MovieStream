import {asyncHandler} from "../utils/AsyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import User from '../models/user.model.js';

const RegisterUser=asyncHandler( async (req,res)=>{
    res.status(200).json({
        message:"Ok"
    })
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    const {email,fullName,password,userName}=req.body;
    console.log("email:" +email);
    console.log("fullname:" +fullname);
    console.log("password:" +password);
    console.log("username:" +username);

    if([email,userName,password,fullName].some((feild)=>feild?.trim()==="")){
        console.log(error);
        throw new ApiError(400,"All feilds are required");
    }

    const existedUser = User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email, 
    password,
    userName: userName.toLowerCase()
});

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
}

return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
)
});
//http://localhost:8000/api/v1/users/register
export default RegisterUser;