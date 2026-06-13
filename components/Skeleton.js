// Shimmer loading placeholders — match the glass design system.
// Use <Skeleton/> for a single block, <SkeletonList/> for a stack of rows.

export function Skeleton({ width = "100%", height = 16, radius = 8, style = {} }) {
  return (
    <div
      className="tf-shimmer"
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        ...style,
      }}
    />
  );
}

// A card-shaped row with an avatar circle + two text lines — good for lists.
export function SkeletonRow({ avatar = true }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        marginBottom: 10,
        borderRadius: 14,
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {avatar && <Skeleton width={38} height={38} radius="50%" />}
      <div style={{ flex: 1 }}>
        <Skeleton width="55%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width="35%" height={10} />
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 5, avatar = true }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} avatar={avatar} />
      ))}
    </div>
  );
}

export default Skeleton;
