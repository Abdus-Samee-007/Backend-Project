import mongoose,{Schema} from "mongoose"

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

export const Tweet = mongoose.model("Tweet", tweetSchema)