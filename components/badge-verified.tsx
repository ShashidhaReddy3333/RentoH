export default function BadgeVerified() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand.green/10 px-2 py-0.5 text-xs font-medium text-brand.green">
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden="true"
        className="fill-current"
      >
        <path d="M6.6 12.2 3 8.6l1.1-1.1 2.5 2.4 5.3-5.3 1.1 1.1z" />
      </svg>
      Verified
    </span>
  );
}
