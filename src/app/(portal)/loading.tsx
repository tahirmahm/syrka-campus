export default function Loading() {
  return (
    <div role="status" aria-label="Loading academic information">
      <span className="sr-only">Loading academic information…</span>
      <div className="loading-line" style={{ width: "35%", height: 28 }} />
      <div className="loading-line" style={{ width: "55%" }} />
      <div className="grid" style={{ marginTop: 28 }}>
        <div className="card loading-card" />
        <div className="card loading-card" />
      </div>
    </div>
  );
}
