import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gigsAPI, bidsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Modal from '../components/Modal';

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gig, setGig] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidMessage, setBidMessage] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchBids = async () => {
    try {
      const response = await bidsAPI.getByGig(id);
      if (response.success) {
        setBids(response.data?.bids || []);
      } else {
        // If error is about not being owner, still try to show bids if available
        console.error('Failed to fetch bids:', response.message);
      }
    } catch (err) {
      console.error('Failed to fetch bids:', err);
    }
  };

  // Initialize Socket.io and listen for new bid events
  const socket = useSocket(user?._id?.toString() || user?._id, null, (data) => {
    // When a new bid is created for this gig, refresh the bids list
    if (data.gigId === id) {
      console.log('New bid detected for this gig, refreshing bids...');
      fetchBids();
    }
  });

  useEffect(() => {
    fetchGig();
    fetchBids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Join/leave gig room when component mounts/unmounts or gig ID changes
  useEffect(() => {
    if (socket && id) {
      socket.emit('join-gig-room', id);
      console.log(`Joined gig room: gig-${id}`);
    }

    return () => {
      if (socket && id) {
        socket.emit('leave-gig-room', id);
        console.log(`Left gig room: gig-${id}`);
      }
    };
  }, [socket, id]);

  const fetchGig = async () => {
    try {
      const response = await gigsAPI.getById(id);
      if (response.success) {
        setGig(response.data);
        // Initialize edit fields with current gig data
        setEditTitle(response.data.title);
        setEditDescription(response.data.description);
        setEditBudget(response.data.budget);
      } else {
        setError(response.message || 'Failed to fetch gig');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch gig');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditTitle(gig.title);
    setEditDescription(gig.description);
    setEditBudget(gig.budget);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(gig.title);
    setEditDescription(gig.description);
    setEditBudget(gig.budget);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const response = await gigsAPI.update(id, editTitle, editDescription, editBudget);
      if (response.success) {
        setGig(response.data);
        setIsEditing(false);
        setError('');
      } else {
        setError(response.message || 'Failed to update gig');
      }
    } catch (err) {
      setError(err.message || 'Failed to update gig');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateBid = async (e) => {
    e.preventDefault();
    setBidLoading(true);

    try {
      const response = await bidsAPI.create(id, bidMessage, parseFloat(bidPrice));
      if (response.success) {
        setBidMessage('');
        setBidPrice('');
        setShowBidForm(false);
        fetchBids();
      } else {
        setError(response.message || 'Failed to create bid');
      }
    } catch (err) {
      setError(err.message || 'Failed to create bid');
    } finally {
      setBidLoading(false);
    }
  };

  const handleHireClick = (bidId) => {
    setSelectedBidId(bidId);
    setShowHireModal(true);
  };

  const handleHireConfirm = async () => {
    if (!selectedBidId) return;

    setShowHireModal(false);
    try {
      const response = await bidsAPI.hire(id, selectedBidId);
      if (response.success) {
        fetchGig();
        fetchBids();
        setSelectedBidId(null);
      } else {
        setError(response.message || 'Failed to hire freelancer');
      }
    } catch (err) {
      setError(err.message || 'Failed to hire freelancer');
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    try {
      const response = await gigsAPI.delete(id);
      if (response.success) {
        navigate('/dashboard');
      }
    }
    catch (err) {
      setError(err.message || 'Failed to delete gig');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-red-600">Gig not found</div>
      </div>
    );
  }

  const isOwner = gig.ownerId?._id === user?._id || gig.ownerId === user?._id;
  const hasBid = bids.some(bid => bid.freelancerId?._id === user?._id || bid.freelancerId === user?._id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-4 text-blue-600 hover:text-blue-800"
      >
        ← Back to Dashboard
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {!isEditing ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">{gig.title}</h1>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditClick}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    aria-label="Edit gig"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-red-500 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    aria-label="Delete gig"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-700 mb-4">{gig.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-blue-600">Budget: {gig.budget}</span>
              <span
                className={`px-3 py-1 rounded ${gig.status === 'open'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}
              >
                {gig.status}
              </span>
            </div>
          </>
        ) : (
          <form onSubmit={handleSaveEdit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={editLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {!isOwner && gig.status === 'open' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {!showBidForm ? (
            <button
              onClick={() => setShowBidForm(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Place a Bid
            </button>
          ) : (
            <form onSubmit={handleCreateBid}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder="Why should you be hired for this gig?"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Price
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  placeholder="Enter your bid amount"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={bidLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {bidLoading ? 'Submitting...' : 'Submit Bid'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBidForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Bids Section - Visible to everyone */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">
          Bids ({bids.length})
          {isOwner && gig.status === 'open' && bids.length > 0 && <span className="text-sm font-normal text-gray-500 ml-2">(You can hire)</span>}
        </h2>
        {bids.length === 0 ? (
          <p className="text-gray-500">No bids yet</p>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <div
                key={bid._id}
                className="border border-gray-200 rounded-lg p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">
                      {bid.freelancerId?.name || 'Unknown'}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${bid.status === 'hired'
                        ? 'bg-green-100 text-green-800'
                        : bid.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {bid.status}
                    </span>
                    {/* Show if this is your bid */}
                    {(bid.freelancerId?._id === user?._id || bid.freelancerId === user?._id) && (
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        Your Bid
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{bid.message}</p>
                  <p className="text-lg font-semibold text-blue-600">${bid.price}</p>
                </div>
                {/* Only show hire button to owner */}
                {isOwner && gig.status === 'open' && bid.status === 'pending' && (
                  <button
                    onClick={() => handleHireClick(bid._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 ml-4"
                  >
                    Hire
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hire Confirmation Modal */}
      <Modal
        isOpen={showHireModal}
        onClose={() => {
          setShowHireModal(false);
          setSelectedBidId(null);
        }}
        onConfirm={handleHireConfirm}
        title="Confirm Hire"
        message="Are you sure you want to hire this freelancer? This action cannot be undone."
        confirmText="Yes, Hire"
        cancelText="Cancel"
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Delete"
        message="Are you sure you want to delete this gig? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
