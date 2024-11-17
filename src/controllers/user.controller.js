import { asyncHandler } from '../utils/asyncHandler.js';
import {apiError} from '../utils/apiError.js'
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {apiResponse} from '../utils/apiResponse.js'

const generateAccessAndRefreshTokens = async(userId)=>
   {
   try {
      // user token and refresh token are generated using the userId
      const user = await User.findById(userId)
     const accessToken = user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false})
      // refresh token gets saved in database

      return {accessToken, refreshToken}

   } catch (error) {
      throw new apiError(500,"Something went wrong while generating Access and Refresh Token")
      
   }
}

const registerUser = asyncHandler( async(req,res) =>{
  
   const { fullName, email, username, password } = req.body
if (fullName === ""){
   throw new apiError(400, "Full name is required")
}
 // can do each one separately or use the some() function
if (
     [fullName, email, username, password].some((field)=> field?.trim()=== "")
   ) {
      throw new apiError(400, "All fields are required")
   }
 
   const existedUser = await User.findOne({
      $or:[{username}, {email} ]
   })

   if (existedUser){
      throw new apiError(409, "User with email or username already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;

   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
       coverImageLocalPath = req.files.coverImage[0].path
   }

   if (!avatarLocalPath) {
      throw new apiError(400, "Avatar is required")
   }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
      throw new apiError(400, "Avatar file is required")
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
      throw new apiError(500, "Failed to create user")
    }

    return res.status(201).json(
      new apiResponse(200,createdUser,"User Registered Successfully")
    )

})

const loginUser =asyncHandler(async (req,res)=>{
   //req -> body
   //username/email exists?
   // find user
   //check password
   // access and refresh token
   //send cookies
   //send response that successfully logged in

   const {email, username, password}= req.body

   if(!(username ||email)){
      throw new apiError(400,"Username or email is required")
   }

  const user = User.findOne({
      $or:[{username},{email}]
      // $ used for mongodb operators
   })

   if(!user){
      throw new apiError(401, "User with this username/email does not exist")
   }

  const isPassValid = await user.isPasswordCorrect(password)

  if(!isPassValid){
   throw new apiError(401,"Invalid user credentials")
  }

  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

})

export {
   registerUser,
    loginUser
}