/**
 * Handles API responses and throws appropriate errors
 * @param {Promise} apiCall - The API call to make
 * @returns {Promise<Object>} - The response data
 */
export const handleApiCall = async (apiCall) => {
  try {
    const response = await apiCall;
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'An error occurred. Please try again.';
    
    // You can add more specific error handling here
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Authentication required');
    } else if (error.response?.status === 403) {
      // Handle forbidden access
      console.error('You do not have permission to perform this action');
    } else if (error.response?.status === 404) {
      // Handle not found
      console.error('The requested resource was not found');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('A server error occurred. Please try again later.');
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Formats error messages from API responses
 * @param {Error} error - The error object
 * @returns {string} - Formatted error message
 */
export const formatErrorMessage = (error) => {
  if (error.response?.data?.errors) {
    // Handle validation errors
    return Object.values(error.response.data.errors)
      .map((err) => err.msg || err)
      .join('\n');
  }
  return error.message || 'An error occurred. Please try again.';
};

/**
 * Creates query string from object
 * @param {Object} params - Query parameters
 * @returns {string} - Formatted query string
 */
export const createQueryString = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => queryParams.append(key, item));
      } else {
        queryParams.append(key, value);
      }
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Handles file uploads
 * @param {File} file - The file to upload
 * @param {string} uploadUrl - The upload endpoint
 * @param {Object} additionalData - Additional form data to include
 * @returns {Promise<Object>} - The upload response
 */
export const uploadFile = async (file, uploadUrl, additionalData = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  
  Object.entries(additionalData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'File upload failed');
  }
  
  return response.json();
};
