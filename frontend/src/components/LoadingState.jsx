/**
 * Loading state with triple-ring spinner and pulsing text.
 */
export default function LoadingState() {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="loading-spinner__ring" />
        <div className="loading-spinner__ring" />
        <div className="loading-spinner__ring" />
      </div>
      <span className="loading-text">Analyzing consequences...</span>
      <span className="loading-subtext">
        Simulating second-order effects, failure modes, and trade-offs
      </span>
    </div>
  );
}
