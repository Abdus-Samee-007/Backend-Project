import mongoose,{Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber :{
        type:Schema.Types.ObjectId, // subscribing
        ref:"User",
    },
    channel:{
        type:Schema.Types.ObjectId, //whom is subscribed
        ref:"User",
    }
},{timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)