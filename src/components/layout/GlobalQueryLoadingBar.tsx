import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 전역 로딩 표시용: React Query의 fetching/mutating 상태를 감지해 상단 로딩바를 보여줍니다.
 */
export function GlobalQueryLoadingBar() {
  const isFetching = useIsFetching() > 0;
  const isMutating = useIsMutating() > 0;
  const isActive = isFetching || isMutating;

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    // clear timers
    for (const t of timeoutsRef.current) window.clearTimeout(t);
    timeoutsRef.current = [];

    if (isActive) {
      setVisible(true);
      setDurationMs(180);
      setProgress(18);

      timeoutsRef.current.push(
        window.setTimeout(() => {
          setDurationMs(650);
          setProgress(70);
        }, 200)
      );

      timeoutsRef.current.push(
        window.setTimeout(() => {
          setDurationMs(2400);
          setProgress(90);
        }, 950)
      );

      return;
    }

    // 완료: 100%로 자연스럽게 마무리 후 사라짐
    if (visible) {
      setDurationMs(260);
      setProgress(100);
      timeoutsRef.current.push(
        window.setTimeout(() => {
          setVisible(false);
          setDurationMs(0);
          setProgress(0);
        }, 320)
      );
    }
  }, [isActive, visible]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-50 h-1 w-full overflow-hidden bg-primary/15 transition-opacity",
        visible ? "opacity-100" : "opacity-0"
      )}
      aria-hidden={!visible}
    >
      <div
        className="h-full origin-left bg-primary"
        style={{
          transform: `scaleX(${progress / 100})`,
          transitionProperty: "transform",
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
        }}
      />
    </div>
  );
}
