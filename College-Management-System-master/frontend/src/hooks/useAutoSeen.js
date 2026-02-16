import { useEffect, useRef } from "react";
import axiosWrapper from "../utils/AxiosWrapper";

const useAutoSeen = (noticeId) => {
  const hasMarkedRef = useRef(false);

  useEffect(() => {
    if (!noticeId) return;
    if (typeof noticeId !== "string") return;
    if (hasMarkedRef.current) return;

    const markAsSeen = async () => {
      try {
        // ✅ FIXED URL (NO /api HERE)
        await axiosWrapper.post(`/notice/seen/${noticeId}`);
        hasMarkedRef.current = true;
        console.log("✅ Notice marked as seen:", noticeId);
      } catch (err) {
        console.error(
          "❌ Auto-seen failed:",
          err.response?.data || err
        );
      }
    };

    markAsSeen();
  }, [noticeId]);
};

export default useAutoSeen;
