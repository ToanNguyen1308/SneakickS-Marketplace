import { useState } from "react";

const Star = ({ filled, onClick, onHover, size = "w-5 h-5", readOnly }) => (
  <svg
    onClick={readOnly ? undefined : onClick}
    onMouseEnter={readOnly ? undefined : onHover}
    className={`${size} ${
      filled ? "text-amber-400" : "text-slate-300"
    } ${readOnly ? "" : "cursor-pointer"}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118L10 14.347l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.643 8.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
  </svg>
);

const RatingStars = ({
  value = 0,
  onChange,
  readOnly = false,
  size = "w-5 h-5",
}) => {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          filled={star <= display}
          onClick={() => onChange?.(star)}
          onHover={() => setHover(star)}
          size={size}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
};

export default RatingStars;
