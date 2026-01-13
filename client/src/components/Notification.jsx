import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Notification({ message, onClose, visible, gigId }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto-close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg min-w-[300px]">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
            aria-label="Close notification"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {gigId && (
          <div className="mt-2 pt-2 border-t border-green-400">
            <Link
              to={`/gig/${gigId}`}
              onClick={onClose}
              className="text-sm font-medium underline hover:text-green-100 transition-colors inline-flex items-center gap-1"
            >
              View Gig
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
