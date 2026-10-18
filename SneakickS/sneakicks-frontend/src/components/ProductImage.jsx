import { useId, useState } from "react";

/**
 * Anh minh hoa san pham dang SVG, to mau theo phoi mau (colors) cua san pham.
 * Dung khi san pham khong co anh that hoac anh loi.
 */

const parseColors = (colors) => {
  const list = (colors || "").split(",").map((c) => c.trim()).filter(Boolean);
  return [list[0] || "#e2e8f0", list[1] || "#ffffff", list[2] || "#111111"];
};

const isLight = (hex) => {
  const h = hex.replace("#", "");
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 200;
};

const Sneaker = ({ c }) => {
  const [upper, accent, detail] = c;
  const sole = isLight(upper) && isLight(accent) ? "#f1f5f9" : "#ffffff";
  const outline = "#94a3b8";
  return (
    <g strokeLinejoin="round">
      <path d="M40 222 Q40 248 72 250 L330 250 Q366 248 366 226 L362 212 L44 212 Z" fill={sole} stroke={outline} strokeWidth="2" />
      <path d="M42 230 L364 230" stroke={outline} strokeWidth="1.5" opacity="0.6" />
      <path d="M48 214 L52 150 Q55 120 86 112 L150 100 Q172 97 188 110 L252 150 Q302 165 342 182 Q364 192 362 214 Z" fill={upper} stroke={outline} strokeWidth="2" />
      <path d="M292 160 Q332 168 352 186 Q364 198 362 214 L302 214 Q286 190 292 160 Z" fill={accent} opacity="0.95" stroke={outline} strokeWidth="1.5" />
      <path d="M48 214 L52 150 Q55 126 76 116 L98 142 L98 214 Z" fill={accent} stroke={outline} strokeWidth="1.5" />
      <path d="M112 196 Q205 178 306 148 Q236 188 122 208 Z" fill={detail} />
      <ellipse cx="128" cy="108" rx="38" ry="9" fill="#1f2937" opacity="0.8" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${170 + i * 20} ${118 + i * 10} l14 -10`} stroke={isLight(upper) ? "#64748b" : "#e2e8f0"} strokeWidth="5" strokeLinecap="round" />
      ))}
    </g>
  );
};

const Apparel = ({ c }) => {
  const [body, logo, trim] = c;
  return (
    <g stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round">
      <path d="M130 62 L172 44 Q200 72 228 44 L270 62 L322 112 L290 140 L270 124 L270 252 L130 252 L130 124 L110 140 L78 112 Z" fill={body} />
      <path d="M172 44 Q200 80 228 44" fill="none" stroke={trim} strokeWidth="4" />
      <rect x="165" y="130" width="70" height="26" rx="2" fill={logo === body ? trim : logo} stroke="none" />
      <path d="M130 238 L270 238" stroke={trim} strokeWidth="4" opacity="0.6" />
    </g>
  );
};

const Accessory = ({ c, silhouette }) => {
  const [main, accent, detail] = c;
  const s = (silhouette || "").toLowerCase();
  if (s.includes("cap")) {
    return (
      <g stroke="#94a3b8" strokeWidth="2">
        <path d="M110 190 Q110 100 200 96 Q290 100 292 190 Z" fill={main} />
        <path d="M280 186 Q340 190 352 214 Q300 214 262 200 Z" fill={main} />
        <circle cx="200" cy="96" r="7" fill={accent} />
      </g>
    );
  }
  if (s.includes("g-shock") || s.includes("watch")) {
    return (
      <g stroke="#94a3b8" strokeWidth="2">
        <rect x="170" y="40" width="60" height="220" rx="14" fill={main} />
        <path d="M150 110 L200 90 L250 110 L250 190 L200 210 L150 190 Z" fill={main} />
        <circle cx="200" cy="150" r="38" fill={isLight(main) ? "#1f2937" : "#e2e8f0"} />
        <path d="M200 150 L200 124 M200 150 L220 160" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g stroke="#94a3b8" strokeWidth="2">
      <rect x="115" y="90" width="170" height="150" rx="24" fill={main} />
      <path d="M150 90 Q150 50 200 50 Q250 50 250 90" fill="none" stroke={detail} strokeWidth="8" />
      <rect x="160" y="140" width="80" height="22" rx="4" fill={accent} stroke="none" />
    </g>
  );
};

const Collectible = ({ c }) => {
  const [main, accent, detail] = c;
  return (
    <g stroke="#94a3b8" strokeWidth="2">
      <rect x="120" y="60" width="160" height="190" rx="16" fill={main} />
      <circle cx="200" cy="130" r="40" fill={accent} />
      <circle cx="186" cy="124" r="6" fill={detail} stroke="none" />
      <circle cx="214" cy="124" r="6" fill={detail} stroke="none" />
      <rect x="150" y="190" width="100" height="34" rx="6" fill={detail} opacity="0.85" />
    </g>
  );
};

const ProductArt = ({ product, className }) => {
  const gid = useId().replace(/:/g, "");
  const c = parseColors(product?.colors);
  const kind = Number(product?.category_id);
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label={product?.name}>
      <defs>
        <radialGradient id={`bg-${gid}`} cx="50%" cy="55%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef2f6" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#bg-${gid})`} />
      <ellipse cx="200" cy="262" rx="150" ry="10" fill="#0f172a" opacity="0.08" />
      {kind === 2 ? (
        <Apparel c={c} />
      ) : kind === 3 ? (
        <Accessory c={c} silhouette={product?.silhouette} />
      ) : kind === 4 ? (
        <Collectible c={c} />
      ) : (
        <Sneaker c={c} />
      )}
    </svg>
  );
};

const ProductImage = ({ product, className = "w-full h-full" }) => {
  const [broken, setBroken] = useState(false);
  const src = product?.image;
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={product.name}
        className={`${className} object-cover`}
        onError={() => setBroken(true)}
      />
    );
  }
  return <ProductArt product={product} className={className} />;
};

export default ProductImage;
