import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema (
    {
    username:{
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type: String,
        required: [true, 'Full name is required'],
        trim:true,
        /// Full name trim not required 
        index:true
    },
    avatar:{
        type:String, //cloudinary url 
        required:true,
    },
    coverImage:{
        type:String, //cloudinary url
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video",
        }
    ],
    password:{
        type: String,
        required:[true,"Password is required"],
    },
    refreshToken:{
        type:String,
    }


}
)

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
} )

userSchema.methods.ispasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function(){
   return jwt.sign(
    {
        _id: this._id,
        email: this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model('User',userSchema);