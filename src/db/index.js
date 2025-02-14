import mongoose from "mongoose";
import {DB_NAME} from "../constants.js "

const connectDB= async() => {
    try {
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       console.log(`MONGO DB CONNECTED!!!! DBHOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGO DB CONNECTION FAILED",error);
    }

}

export default connectDB;