import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens = async(userId)=>
   {
   try {
      // user token and refresh token are generated using the userId
      const user = await User.findById(userId)
     const accessToken = await user.generateAccessToken()
     const refreshToken = await user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false})
      // refresh token gets saved in database

      return {accessToken, refreshToken}

   } catch (error) {
      throw new ApiError(500,"Something went wrong while generating Access and Refresh Token")
      
   }
}

const registerUser = asyncHandler( async(req,res) =>{
  
   const { fullName, email, username, password } = req.body
if (fullName === ""){
   throw new ApiError(400, "Full name is required")
}
 // can do each one separately or use the some() function
if (
     [email, username, password].some((field)=> field?.trim()=== "")
   ) {
      throw new ApiError(400, "All fields are required")
   }
 
   const existedUser = await User.findOne({
      $or:[{username}, {email} ]
   })

   if (existedUser){
      throw new ApiError(409, "User with email or username already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;

   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
       coverImageLocalPath = req.files.coverImage[0].path
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required")
   }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
      throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      username: username.toLowerCase(),
      password
    })

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    )

    if(!createdUser){
      throw new ApiError(500, "Failed to create user")
    }

    return res.status(201).json(
      new ApiResponse(200,createdUser,"User Registered Successfully")
    )

})

const loginUser = asyncHandler(async (req,res)=>{
   //req -> body
   //username/email exists?
   // find user
   //check password
   // access and refresh token
   //send cookies
   //send response that successfully logged in

   const {email, username, password}= req.body
   // console.log(email);

   if(!username && !email){
      throw new ApiError(400,"Username or email is required")
   }

  const user =await User.findOne({
      $or:[{username},{email}]
      // $ used for mongodb operators
   })

   if(!user){
      throw new ApiError(401, "User with this username/email does not exist")
   }
   console.log(user.ispasswordCorrect);
   
   const isPassValid = await user.ispasswordCorrect(password)

  if(!isPassValid){
   throw new ApiError(401,"Invalid user credentials")
  }

  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).
  select("-password -refreshToken")

  const options={
   httpOnly:true,
   secure:true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
   new ApiResponse(200,{
      user: loggedInUser,accessToken,refreshToken
   },
   "User Logged In Successfully")
  )

})

const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
   req.user._id,
   {
      $unset:{
         refreshToken: 1
      }
   },
   {
      new:true
   }
  )

  const options={
   httpOnly:true,
   secure:true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out Successfully"))
})

export {
   registerUser,
   loginUser,
   logoutUser
}