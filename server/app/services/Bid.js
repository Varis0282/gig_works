import mongoose from 'mongoose';
import Bid from '../models/Bid.js';
import Gig from '../models/Gig.js';
import { successObject, errorObject } from '../../lib/settings.js';

const bidServices = {
    createBid: async (data) => {
        try {
            const newBid = new Bid(data);
            await newBid.save();
            
            // Emit Socket.io event for new bid
            if (global.io) {
                const gig = await Gig.findById(data.gigId);
                if (gig) {
                    // Emit to a gig-specific room so all users viewing this gig get updated
                    const gigRoom = `gig-${data.gigId}`;
                    global.io.to(gigRoom).emit('new-bid', {
                        gigId: data.gigId.toString(),
                        bidId: newBid._id.toString(),
                        message: 'New bid placed on this gig'
                    });
                    console.log(`New bid notification sent to room: ${gigRoom}`);
                }
            }
            
            return { ...successObject, data: newBid, message: "Bid created successfully" };
        } catch (error) {
            return { ...errorObject, data: null, message: "Failed to create bid" };
        }
    },
    getBidsForGig: async (params) => {
        try {
            const gig = await Gig.findById(params.gigId);
            if(!gig){
                return { ...errorObject, data: null, message: "Gig not found" };
            }
            const bids = await Bid.find({ gigId: params.gigId }).populate('freelancerId','name email _id');
            return { ...successObject, data: { bids, gig }, message: "Bids fetched successfully" };
        } catch (error) {
            return { ...errorObject, data: null, message: "Failed to fetch bids" };
        }
    },
    hireBid: async (params, data) => {
        const session = await mongoose.startSession();
        let freelancerId = null;
        let gigTitle = null;
        
        try {
            await session.withTransaction(async () => {
                // First verify gig exists and user is owner (read-only check)
                const gig = await Gig.findById(params.gigId).session(session);
                if(!gig){
                    throw new Error("Gig not found");
                }
                if(gig.ownerId.toString() !== data.ownerId.toString()){
                    throw new Error("You are not the owner of this gig");
                }
                
                // Store gig title for notification
                gigTitle = gig.title;
                
                // Verify bid exists and belongs to this gig
                const bid = await Bid.findOne({ 
                    _id: data.bidId, 
                    gigId: params.gigId 
                }).session(session);
                if(!bid){
                    throw new Error("Bid not found");
                }
                
                // Store freelancerId for notification
                freelancerId = bid.freelancerId.toString();
                
                // Atomic update: Only update gig if it's still "open" (prevents race conditions)
                const gigUpdateResult = await Gig.updateOne(
                    { 
                        _id: params.gigId, 
                        status: 'open',
                        ownerId: data.ownerId 
                    },
                    { $set: { status: 'assigned' } },
                    { session }
                );
                
                // If no document was updated, gig was already assigned (race condition detected)
                if(gigUpdateResult.matchedCount === 0){
                    throw new Error("Gig is already assigned");
                }
                
                // Atomic update: Only update bid if it's still "pending"
                const bidUpdateResult = await Bid.updateOne(
                    { 
                        _id: data.bidId, 
                        gigId: params.gigId,
                        status: 'pending'  // Only update if still pending
                    },
                    { $set: { status: 'hired' } },
                    { session }
                );
                
                if(bidUpdateResult.matchedCount === 0){
                    throw new Error("Bid is no longer available for hiring");
                }
                
                // Mark other bids as rejected
                await bidServices.markBidAsRejected(params.gigId, data.bidId, session);
            });
            
            // Re-fetch bid to return the updated data
            const bid = await Bid.findById(data.bidId);
            
            // Emit real-time notification to the freelancer after successful transaction
            if (global.io && freelancerId && gigTitle) {
                const roomName = `user-${freelancerId}`;
                global.io.to(roomName).emit('freelancer-hired', {
                    message: `You have been hired for ${gigTitle}!`,
                    gigId: params.gigId,
                    gigTitle: gigTitle,
                    bidId: data.bidId
                });
                console.log(`Notification sent to freelancer ${freelancerId} for gig: ${gigTitle}`);
            }
            
            return { ...successObject, data: bid, message: "Bid hired successfully" };
        } catch (error) {
            const errorMessage = error.message === "Gig not found" || 
                                error.message === "You are not the owner of this gig" ||
                                error.message === "Bid not found" ||
                                error.message === "Gig is already assigned" ||
                                error.message === "Bid is no longer available for hiring"
                                ? error.message 
                                : "Failed to hire bid";
            return { ...errorObject, data: null, message: errorMessage };
        } finally {
            await session.endSession();
        }
    },
    markBidAsRejected: async (gigId, hiredBidId, session = null) => {
        try {
            const query = Bid.updateMany(
                { 
                    gigId: gigId, 
                    _id: { $ne: hiredBidId },
                    status: { $ne: 'rejected' } 
                },
                { $set: { status: 'rejected' } }
            );
            if (session) {
                query.session(session);
            }
            const result = await query;
            return { ...successObject, data: result, message: "Bids marked as rejected successfully" };
        } catch (error) {
            return { ...errorObject, data: null, message: "Failed to mark bid as rejected" };
        }
    },
}

export default bidServices;