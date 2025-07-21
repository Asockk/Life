// components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <svg 
                className="mx-auto h-12 w-12 text-red-500 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Ein Fehler ist aufgetreten
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Die Anwendung hat einen unerwarteten Fehler festgestellt. 
                Bitte versuchen Sie es erneut oder laden Sie die Seite neu.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    Technische Details anzeigen
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Erneut versuchen
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Seite neu laden
                </button>
              </div>
              
              {this.state.errorCount > 2 && (
                <p className="mt-4 text-sm text-orange-600 dark:text-orange-400">
                  Hinweis: Der Fehler tritt wiederholt auf. Bitte löschen Sie ggf. 
                  Ihre Browser-Daten oder kontaktieren Sie den Support.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Spezifische Error Boundary für kritische Komponenten
export class CriticalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Critical component error:', error, errorInfo);
    
    // Speichere den Fehler im localStorage für Debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        component: this.props.componentName || 'Unknown'
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('blutdruck_error_logs') || '[]');
      existingLogs.push(errorLog);
      
      // Behalte nur die letzten 10 Fehler
      if (existingLogs.length > 10) {
        existingLogs.shift();
      }
      
      localStorage.setItem('blutdruck_error_logs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">
            Diese Komponente konnte nicht geladen werden. 
            {this.props.fallbackMessage || 'Bitte laden Sie die Seite neu.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;