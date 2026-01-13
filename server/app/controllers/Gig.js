import express from 'express';
import gigServices from '../services/Gig.js';
import userAuthentication from '../middleware/userAuthentication.js';

const router = express.Router();

router.post('/', userAuthentication, async (req, res) => {
    const data = req.body;
    data.ownerId = req.user._id;
    const result = await gigServices.createGig(data);
    res.status(201).json(result);
});

router.get('/', userAuthentication, async (req, res) => {
    const result = await gigServices.getGigs();
    res.status(200).json(result);
});

router.get('/:id', userAuthentication, async (req, res) => {
    const result = await gigServices.getGigById(req.params.id);
    res.status(200).json(result);
});

router.put('/:id', userAuthentication, async (req, res) => {
    req.body.ownerId = req.user._id;
    const result = await gigServices.updateGig(req.params.id, req.body);
    res.status(200).json(result);
});

router.delete('/:id', userAuthentication, async (req, res) => {
    const result = await gigServices.deleteGig(req.params.id);
    res.status(200).json(result);
});

export default router;