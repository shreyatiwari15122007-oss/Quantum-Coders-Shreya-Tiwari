// Shown wherever a food listing has no photo yet — on the browse grid
// (FoodCard) and the detail page (FoodDetails). Replaces the old plain-text
// "No photo" block with a soft plus-in-circle mark on a dashed card, so an
// unphotographed listing still reads as "food is here, just no picture" and
// not as a broken/missing image.
export default function PhotoPlaceholder({ className = "h-40", label = "No photo yet" }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-canopy-100 bg-canopy-50 text-canopy-400 ${className}`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
        </svg>
      </span>
      {label && <span className="text-xs font-medium text-ink/40">{label}</span>}
    </div>
  );
}
