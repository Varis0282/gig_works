import express from 'express';
import userServices from '../services/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    const data = req.body;
    const result = await userServices.signup(data);
    res.status(201).json(result);
});
router.post('/login', async (req, res) => {
    const data = req.body;
    const result = await userServices.login(data);
    res.cookie('token', result.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });    
    res.status(200).json(result);
});

export default router;