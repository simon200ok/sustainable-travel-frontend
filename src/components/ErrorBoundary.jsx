import { Component } from "react";

// Stops one broken component from blanking the whole app
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="container" style={{ padding: "64px 24px" }} role="alert">
        <div className="notice notice-error">
          <span className="notice-icon" aria-hidden="true">⚠️</span>
          <div>
            <strong>{this.props.title || "Something went wrong on this page"}</strong>
            Please reload the page. If it keeps happening, <a href="/contact?topic=problem" className="inline-link">let us know</a>.
            <div className="notice-actions">
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
