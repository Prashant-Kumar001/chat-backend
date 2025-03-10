import mongoose from "mongoose";
import config from "./dotenv.js";
import logger from '../utils/logg.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.MONGO_URI);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        logger.info(`Database Name: ${conn.connection.db.databaseName}`);
    } catch (error) {
        logger.error(`Database Connection Error: ${error.message}`);
        process.exit(1); 
    }
};


mongoose.connection.on("connecting", () => {
    logger.info("Connecting to MongoDB...");
});

mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected successfully");
});

mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected. Attempting to reconnect...");
    connectDB();
});
mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected successfully");
});

mongoose.connection.on("error", (error) => {
    logger.error(`Database Connection Error: ${error.message}`);
});


export default connectDB;
