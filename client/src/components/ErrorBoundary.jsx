import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error caught by boundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.assign('/dashboard');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 text-center">
          <p className="text-5xl">!</p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-800">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            An unexpected error occurred. Your data is safe. Try returning to the dashboard, and if the problem persists please report it.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Back to dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
