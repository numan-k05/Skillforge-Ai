import { Component } from "react";
import { ErrorState } from "./Feedback.jsx";

export default class RouteErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main id="main-content" tabIndex={-1} className="container sf-page"><ErrorState title="This page couldn't open" message="Reload to get the latest version. Your saved account data will remain available." onRetry={() => window.location.reload()} /></main>;
    return this.props.children;
  }
}
