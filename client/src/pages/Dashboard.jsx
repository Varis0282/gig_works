import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gigsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

export default function Dashboard() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Listen for new bid and new gig events to refresh gigs
  useSocket(
    user?._id?.toString() || user?._id,
    null, // onNotification (for freelancer-hired)
    (data) => {
      // When a new bid is created, refresh the gigs list to update bid counts
      console.log('New bid detected, refreshing gigs...');
      fetchGigs();
    },
    (data) => {
      // When a new gig is created, refresh the gigs list
      console.log('New gig detected, refreshing gigs...');
      fetchGigs();
    }
  );

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const response = await gigsAPI.getAll();
      if (response.success) {
        setGigs(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch gigs');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch gigs');
    } finally {
      setLoading(false);
    }
  };

  // Separate gigs into "Your Gigs" and "Available Gigs"
  const yourGigs = gigs.filter((gig) => {
    const ownerId = gig.ownerId?._id || gig.ownerId;
    const userId = user?._id;
    return ownerId?.toString() === userId?.toString();
  });

  const availableGigs = gigs.filter((gig) => {
    const ownerId = gig.ownerId?._id || gig.ownerId;
    const userId = user?._id;
    return ownerId?.toString() !== userId?.toString() && gig.status === 'open';
  });

  const GigCard = ({ gig }) => (
    <Link
      to={`/gig/${gig._id}`}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {gig.title}
        <span className="text-base font-normal text-gray-500 ml-2">
          ({gig.bidCount || 0} {gig.bidCount === 1 ? 'bid' : 'bids'})
        </span>
      </h2>
      <p className="text-gray-600 mb-4 line-clamp-3">
        {gig.description}
      </p>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-blue-600">
          Budget: {gig.budget}
        </span>
        <span
          className={`text-sm px-2 py-1 rounded ${
            gig.status === 'open'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {gig.status}
        </span>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/create-gig"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Gig
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Your Gigs Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Your Gigs</h2>
          <span className="text-sm text-gray-500">({yourGigs.length})</span>
        </div>
        {yourGigs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg mb-4">You haven't created any gigs yet</p>
            <Link
              to="/create-gig"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Gig
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yourGigs.map((gig) => (
              <GigCard key={gig._id} gig={gig} />
            ))}
          </div>
        )}
      </div>

      {/* Available Gigs Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Available Gigs</h2>
          <span className="text-sm text-gray-500">({availableGigs.length})</span>
        </div>
        {availableGigs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No available gigs to bid on</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableGigs.map((gig) => (
              <GigCard key={gig._id} gig={gig} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
