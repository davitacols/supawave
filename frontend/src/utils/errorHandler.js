// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION', 
  AUTHENTICATION: 'AUTHENTICATION',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  OFFLINE: 'OFFLINE'
};

// Error messages for users
const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Network connection failed. Please check your internet.',
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
  [ERROR_TYPES.AUTHENTICATION]: 'Please login again to continue.',
  [ERROR_TYPES.PERMISSION]: 'You don\'t have permission for this action.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested item was not found.',
  [ERROR_TYPES.SERVER]: 'Server error occurred. Please try again later.',
  [ERROR_TYPES.OFFLINE]: 'You\'re offline. Some features may not work.'
};

class ErrorHandler {
  static getErrorType(error) {
    if (!navigator.onLine) return ERROR_TYPES.OFFLINE;
    
    if (error.response) {
      const status = error.response.status;
      if (status === 401) return ERROR_TYPES.AUTHENTICATION;
      if (status === 403) return ERROR_TYPES.PERMISSION;
      if (status === 404) return ERROR_TYPES.NOT_FOUND;
      if (status === 400) return ERROR_TYPES.VALIDATION;
      if (status >= 500) return ERROR_TYPES.SERVER;
    }
    
    if (error.message?.includes('Network') || error.message?.includes('fetch')) {
      return ERROR_TYPES.NETWORK;
    }
    
    return ERROR_TYPES.SERVER;
  }

  static getUserMessage(error) {
    const errorType = this.getErrorType(error);
    return ERROR_MESSAGES[errorType];
  }

  static handle(error, context = '') {
    const errorType = this.getErrorType(error);
    const userMessage = this.getUserMessage(error);
    
    // Log for debugging
    console.error(`[${context}] ${errorType}:`, error);
    
    // Show user-friendly message
    this.showError(userMessage, errorType);
    
    // Handle specific error types
    if (errorType === ERROR_TYPES.AUTHENTICATION) {
      this.handleAuthError();
    }
    
    return { type: errorType, message: userMessage };
  }

  static showError(message, type) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg max-w-md ${
      type === 'SUCCESS' ? 'bg-green-100 text-green-800' :
      type === ERROR_TYPES.OFFLINE ? 'bg-yellow-100 text-yellow-800' :
      type === ERROR_TYPES.AUTHENTICATION ? 'bg-red-100 text-red-800' :
      'bg-red-100 text-red-800'
    }`;
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-lg">&times;</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  static handleAuthError() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  static async withErrorHandling(asyncFn, context = '') {
    try {
      return await asyncFn();
    } catch (error) {
      return this.handle(error, context);
    }
  }
}

export default ErrorHandler;