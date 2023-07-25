/*****  Packages  *****/
import mongoose from "mongoose";
/*****  Modules  *****/
import {getEnv} from "#utils/common/env";

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true);
        const conn = await mongoose.connect(getEnv('MONGO_URI'), {  });
        console.log(`Database is Connected on ${conn.connection.host}`)

    } catch (error) {
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB
