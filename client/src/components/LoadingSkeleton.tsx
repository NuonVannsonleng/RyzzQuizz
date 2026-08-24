/** Grid of pulsing placeholder cards — shown while the catalog request is in flight, instead of a blank pane. */
export function QuizGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="quizgrid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div className="skeleton-card">
            <div className="skeleton-line skeleton-line--emoji" />
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--sub" />
            <div className="skeleton-line skeleton-line--foot" />
          </div>
        </li>
      ))}
    </ul>
  );
}
