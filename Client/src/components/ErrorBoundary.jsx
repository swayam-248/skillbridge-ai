import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SkillBridge ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900">
          <div className="w-full max-w-lg bg-white p-8 md:p-10 rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-rose-100 text-3xl text-rose-600 font-bold">
              ⚠️
            </div>
            <h2 className="text-2xl font-black text-slate-900">Something went wrong</h2>
            <p className="text-slate-600 text-sm">
              An unexpected display error occurred while rendering this view.
            </p>
            {this.state.error && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs font-mono text-rose-800 text-left overflow-x-auto max-h-32">
                {String(this.state.error?.message || this.state.error)}
              </div>
            )}
            <div className="pt-2 flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm"
              >
                🔄 Refresh Page
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.clear();
                  window.location.href = "/login";
                }}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition border border-slate-200"
              >
                Sign In Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
