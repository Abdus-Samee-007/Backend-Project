import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import { response } from "express";
import mongoose from "mongoose";

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

const refreshAccessToken= asyncHandler(async(req,res)=> {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken)
{
   throw new ApiError(401,"Unauthorized refresh")
}

try{

   const decodedToken= jwt.verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
   )
   
   const user = await User.findById(decodedToken?._id)
   
   if(!user){
      throw new ApiError(401,"Invalid refresh token")
   }
   
   if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Invalid refresh token")
   }
   
   const options ={
      httpOnly:true,
      secure:true
   }
   
   const{accessToken, newRefreshToken} = await
   generateAccessAndRefreshTokens(user._id)
   
   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newRefreshToken,options)
   .json(
      new ApiResponse(200,{
         accessToken,
         refreshToken:newRefreshToken,
      },
      "Access Token Refreshed"
   )
   )
}
 catch(error){
   throw new ApiError(401,error?.message || "invalid refresh token")
}
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
   const{oldPassword, newPassword} = req.body
   // newpassword,confPassword would be present
   // if(!(oldPassword === newPassword)){
   //    throw new ApiError(400,"New password and confirm password should be same")
   // }

  const user =  User.findById(req.user?._id)
  const ispasswordCorrect = await user.ispasswordCorrect(oldPassword)
  

  if(!ispasswordCorrect){
   throw new ApiError(400,"Incorrect old password")
  }

  user.password= newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(new ApiResponse(200,{},"password saved successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
   return res
   .status(200)
   .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
   const{fullName, email} = req.body

   if(!fullName || !email){
      throw new ApiError(400,"Full name and email are required")
   }

  const user = await User.findByIdAndUpdate(
   req.user?._id,
   {
      $set:{
         fullName,
         email
      }
   },
   {new:true}
).select("-password")

return res
.status(200)
 .json(new ApiResponse(200,user,"Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   req.file?.path
   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
      throw new ApiError(400,"Error while uploading avatar")
   }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar: avatar.url
         }
      },
      {new:true}
   ).select("-password")

   return res
  .status(200)
  .json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
   req.file?.path
   if(!coverImageLocalPath){
      throw new ApiError(400,"Cover Image file is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
      throw new ApiError(400,"Error while uploading cover image")
   }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage: coverImage.url
         }
      },
      {new:true}
   ).select("-password")

   return res
  .status(200)
  .json(new ApiResponse(200,user,"Cover Image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
   const {username} = req.params
   if(!username){
      throw new ApiError(400,"Username is not found/missing")
   }

   const channel = await User.aggregate([
      {
         $match:{
            username:username?.toLowerCase()
         }
      },
         {
            $lookup:{
               from:"subscriptions",
               localField:"_id",
               foreignField:"channel",
               as:"subscribers"
            }
         },
         {
            $lookup:{
               from:"subscriptions",
               localField:"_id",
               foreignField:"subscriber",
               as:"subscribedTo"
            }
         },
         {
            $addFields:{
               subscribersCount:{
                  $size:"$subscribers"
               },
               channelsSubscribedToCount:{
                     $size:"$subscribedTo"
               },
               isSubscribed:{
                  $cond: {
                     if:{
                        $in:[req.user?._id, "$subscribers.subscriber"],
                        then:true,
                        else:false
                     }
                  }
               }
            }
         },
            {
               $project:{
                  fullName:1,
                  username:1,
                  subscribersCount:1,
                  channelsSubscribedToCount:1,
                  isSubscribed:1,
                  avatar:1,
                  coverImage:1,
                  email:1,
                  _id:0
             }
            }
   ])
   
   if(!channel?.length){
      throw new ApiError(404,"Channel does not exist")
   }

   return res
  .status(200)
  .json(new ApiResponse(200,channel[0],"Channel profile fetched successfully"))
})

const getWatchHistory =asyncHandler(async(req, res)=>{
   const user = await User.aggregate([
      {
         $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
               {
                  $lookup:{
                     from:"users",
                     localField:"owner",
                     foreignField:"_id",
                     as:"owner",
                     pipeline:[
                        {
                           $project:{
                              fullName:1,
                              username:1,
                              avatar:1
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields:{
                     owner:{
                        $first:"$owner"
                     }
                  }
               }
            ]

         }
      }
   ])

   return res
   .status(200)
   .json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully"))
})

export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}