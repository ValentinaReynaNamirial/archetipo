import Link from "next/link";

export function ProfilesTabs({
  active,
  activeCount,
  archivedCount,
}: {
  active: "active" | "archived";
  activeCount: number;
  archivedCount: number;
}) {
  return (
    <div className="tabs-strip anim-fade-up anim-delay-1">
      <Link href="/profiles" className={`tab${active === "active" ? " active" : ""}`}>
        Active <span className="tab-count">{activeCount}</span>
      </Link>
      <Link href="/profiles/archived" className={`tab${active === "archived" ? " active" : ""}`}>
        Archived <span className="tab-count">{archivedCount}</span>
      </Link>
    </div>
  );
}
