import Gig from '../models/Gig.js';
import Bid from '../models/Bid.js';
import { successObject, errorObject } from '../../lib/settings.js';
import _ from 'lodash';

const gigServices = {
    createGig: async (data) => {
        try {
            const newGig = new Gig(data);
            await newGig.save();
            if (global.io && newGig.title) {
                // Emit to all connected users except the owner
                const ownerId = data.ownerId?.toString() || data.ownerId;
                const ownerRoom = `user-${ownerId}`;
                // Emit to all-users room but exclude the owner's personal room
                global.io.to('all-users').except(ownerRoom).emit('new-gig', {
                    message: `New gig created: ${newGig.title}`,
                    gigId: newGig._id.toString(),
                    gigTitle: newGig.title,
                });
                console.log(`New gig notification sent to all users except owner ${ownerId}: ${newGig.title}`);
            }
            return { ...successObject, data: newGig, message: "Gig created successfully" };
        } catch (error) {
            return { ...errorObject, data: null, message: "Failed to create gig" };
        }
    },
    getGigs: async () => {
        try {
            const gigs = await Gig.find();
            
            // Get bid counts for each gig
            const gigsWithBidCounts = await Promise.all(
                gigs.map(async (gig) => {
                    const bidCount = await Bid.countDocuments({ gigId: gig._id });
                    return {
                        ...gig.toObject(),
                        bidCount
                    };
                })
            );
            
            return { ...successObject, data: gigsWithBidCounts, message: "Gigs fetched successfully" };
        } catch (error) {
            return { ...errorObject, data: null, message: "Failed to fetch gigs" };
        }
    },
    getGigById: async (id) => {
        try {
            const gig = await Gig.findById(id);
            return { ...successObject, data: gig, message: "Gig fetched successfully" };
        } catch (error) {
            return { ...errorObject, data: null, message: "Failed to fetch gig" };
        }
    },
    updateGig: async (id, data) => {
        try {
            const gig = await gigServices.getGigById(id);
            if(!gig.success){
                return gig;
            }
            const gigData = gig.data;
            if(gigData.ownerId.toString() !== data.ownerId.toString()){
                return { ...errorObject, data: null, message: "You are not the owner of this gig" };
            }
            _.each(data, (value, key) => {
                gigData[key] = value;
            });
            const updatedGig = await gigData.save();
            return { ...successObject, data: updatedGig, message: "Gig updated successfully" };
        } catch (error) {
            console.log(error);
            return { ...errorObject, data: null, message: "Failed to update gig" };
        }
    },
    deleteGig: async (id) => {
        try {
            const gig = await Gig.findByIdAndDelete(id);
            return { ...successObject, data: gig, message: "Gig deleted successfully" };
        } catch (error) {
            return { ...errorObject, data: null, message: "Failed to delete gig" };
        }
    }
}

export default gigServices;