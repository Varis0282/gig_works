import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { errorObject } from '../../lib/settings.js';
dotenv.config();

const userAuthentication = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ ...errorObject, message: "No token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ ...errorObject, message: "Invalid token" });
        }
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ ...errorObject, message: "User not found" });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ ...errorObject, message: error.message || "Unauthorized" });
    }
}

export default userAuthentication;