import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { successObject, errorObject } from '../../lib/settings.js';
import dotenv from 'dotenv';
dotenv.config();

const userServices = {
    signup: async (data) => {
        try {
            const newUser = new User(data);
            await newUser.save();
            newUser.password = undefined;
            return { ...successObject, data: newUser, message: "User created successfully" };
        } catch (error) {
            if (error.code === 11000) {
                return { ...errorObject, data: null, message: "User already exists" };
            }
            return { ...errorObject, data: null, message: "Failed to create user" };
        }
    },
    login: async (data) => {
        try {
            const user = await User.findOne({ email: data.email });
            if (!user) {
                return { ...errorObject, message: "User not found" };
            }
            const isPasswordCorrect = await user.comparePassword(data.password);
            if (!isPasswordCorrect) {
                return { ...errorObject, message: "Invalid password" };
            }
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            user.password = undefined;
            return { ...successObject, data: { user, token }, message: "Login successful" };
        } catch (error) {
            return { ...errorObject, message: error.message || "Failed to login" };
        }
    }
}

export default userServices;