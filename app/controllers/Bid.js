import express from 'express';
import bidServices from '../services/Bid.js';
import userAuthentication from '../middleware/userAuthentication.js';

const router = express.Router();

router.post('/', userAuthentication, async (req, res) => {
    const data = req.body;
    data.freelancerId = req.user._id;
    const result = await bidServices.createBid(data);
    res.status(201).json(result);
});

router.get('/:gigId', userAuthentication, async (req, res) => {
    const result = await bidServices.getBidsForGig(req.params);
    res.status(200).json(result);
});

router.patch('/:gigId/hire', userAuthentication, async (req, res) => {
    req.body.ownerId = req.user._id;
    const result = await bidServices.hireBid(req.params, req.body);
    res.status(200).json(result);
});

export default router;