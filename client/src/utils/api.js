const API_BASE_URL = 'http://localhost:5555/api';

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to get user data
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Helper function to set auth data
export const setAuth = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

// Helper function to clear auth data
export const clearAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = token;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (name, email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
};

// Gigs API
export const gigsAPI = {
  getAll: async () => {
    return apiRequest('/gigs');
  },
  getById: async (id) => {
    return apiRequest(`/gigs/${id}`);
  },
  create: async (title, description, budget) => {
    return apiRequest('/gigs', {
      method: 'POST',
      body: JSON.stringify({ title, description, budget }),
    });
  },
  update: async (id, title, description, budget) => {
    return apiRequest(`/gigs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, budget }),
    });
  },
  delete: async (id) => {
    return apiRequest(`/gigs/${id}`, {
      method: 'DELETE',
    });
  },
};

// Bids API
export const bidsAPI = {
  create: async (gigId, message, price) => {
    return apiRequest('/bids', {
      method: 'POST',
      body: JSON.stringify({ gigId, message, price }),
    });
  },
  getByGig: async (gigId) => {
    return apiRequest(`/bids/${gigId}`);
  },
  hire: async (gigId, bidId) => {
    return apiRequest(`/bids/${gigId}/hire`, {
      method: 'PATCH',
      body: JSON.stringify({ bidId }),
    });
  },
};
