import { useEffect } from "react";
import { flush, trackView } from "../lib/tracking";

const MIN_DWELL_MS = 500;

/**
 * Ghi 1 su kien `view` khi roi trang san pham, kem thoi gian xem thuc te (dwell time).
 * Chi tinh thoi gian tab dang hien thi. Ghi ca khi chuyen trang trong SPA (unmount)
 * lan khi dong tab / tai lai trang (pagehide).
 */
const useProductViewTracking = (productId, source) => {
  useEffect(() => {
    if (!productId) return undefined;
    let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    let dwell = 0;
    let recorded = false;

    const record = () => {
      if (recorded) return;
      recorded = true;
      if (visibleSince) dwell += Date.now() - visibleSince;
      visibleSince = null;
      // Bo qua mount/unmount gia (React StrictMode) va luot luot qua rat nhanh.
      if (dwell >= MIN_DWELL_MS) trackView(productId, dwell, source);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden" && visibleSince) {
        dwell += Date.now() - visibleSince;
        visibleSince = null;
      } else if (document.visibilityState === "visible" && !visibleSince) {
        visibleSince = Date.now();
      }
    };

    const onPageHide = () => {
      record();
      flush(true);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      record();
    };
  }, [productId, source]);
};

export default useProductViewTracking;
