import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(MONGODB_URI);
        console.log(`Connected to MongoDB with database: ${connection.connection.db.databaseName}`);
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        throw error;
    }
}

export default connectDB;