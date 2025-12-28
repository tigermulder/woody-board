import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { kanbanApi } from "@/api/kanban";
import type { ApiError, CardType, ColumnType } from "@/types/api";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function findContainerId(columns: ColumnType[], id: string) {
  if (columns.some((c) => c.id === id)) return id;
  for (const column of columns) {
    if (column.cards.some((card) => card.id === id)) return column.id;
  }
  return null;
}

function shallowCloneColumns(columns: ColumnType[]) {
  return columns.map((c) => ({ ...c, cards: c.cards.slice() }));
}

function buildCardPositionMap(columns: ColumnType[]) {
  const map = new Map<string, { columnId: string; order: number }>();
  for (const column of columns) {
    for (let i = 0; i < column.cards.length; i++) {
      map.set(column.cards[i].id, { columnId: column.id, order: i });
    }
  }
  return map;
}

type UseBoardDndParams = {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  columns: ColumnType[] | undefined;
  getColumnsCache: () => ColumnType[];
  setColumnsCache: (next: ColumnType[]) => void;
};

/**
 * 보드 DnD 로직.
 * - 낙관적 캐시 업데이트
 * - 종료 시 변경분만 서버 반영
 * - 실패 시 스냅샷 롤백
 */
export function useBoardDnd({
  activeId,
  setActiveId,
  columns,
  getColumnsCache,
  setColumnsCache,
}: UseBoardDndParams) {
  const queryClient = useQueryClient();
  const snapshotRef = useRef<ColumnType[] | null>(null);

  const overlayCard: CardType | null = useMemo(() => {
    if (!activeId || !columns) return null;
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const onDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      setActiveId(String(active.id));
      snapshotRef.current = shallowCloneColumns(getColumnsCache());
    },
    [getColumnsCache, setActiveId]
  );

  const onDragCancel = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (snapshot) setColumnsCache(snapshot);
    snapshotRef.current = null;
    setActiveId(null);
  }, [setActiveId, setColumnsCache]);

  const onDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over) return;
      const activeCardId = String(active.id);
      const overId = String(over.id);
      const current = getColumnsCache();

      const activeContainerId = findContainerId(current, activeCardId);
      const overContainerId = findContainerId(current, overId);
      if (!activeContainerId || !overContainerId) return;
      if (activeContainerId === overContainerId) return;

      const next = shallowCloneColumns(current);
      const source = next.find((c) => c.id === activeContainerId);
      const target = next.find((c) => c.id === overContainerId);
      if (!source || !target) return;

      const fromIndex = source.cards.findIndex((c) => c.id === activeCardId);
      if (fromIndex < 0) return;
      const [moved] = source.cards.splice(fromIndex, 1);

      const overIsContainer = overContainerId === overId;
      const toIndexRaw = overIsContainer
        ? target.cards.length
        : target.cards.findIndex((c) => c.id === overId);
      const toIndex = clamp(toIndexRaw, 0, target.cards.length);
      target.cards.splice(toIndex, 0, moved);

      setColumnsCache(next);
    },
    [getColumnsCache, setColumnsCache]
  );

  const onDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      const snapshot = snapshotRef.current;
      snapshotRef.current = null;

      try {
        if (!over) {
          if (snapshot) setColumnsCache(snapshot);
          return;
        }

        const activeCardId = String(active.id);
        const overId = String(over.id);
        const current = getColumnsCache();

        const activeContainerId = findContainerId(current, activeCardId);
        const overContainerId = findContainerId(current, overId);
        if (!activeContainerId || !overContainerId) return;

        // 같은 컬럼 내 reorder 확정
        if (activeContainerId === overContainerId) {
          const next = shallowCloneColumns(current);
          const container = next.find((c) => c.id === activeContainerId);
          if (!container) return;

          const fromIndex = container.cards.findIndex(
            (c) => c.id === activeCardId
          );
          const overIsContainer = overId === activeContainerId;
          const toIndexRaw = overIsContainer
            ? container.cards.length
            : container.cards.findIndex((c) => c.id === overId);
          if (fromIndex >= 0 && toIndexRaw >= 0) {
            const [moved] = container.cards.splice(fromIndex, 1);
            const toIndex = clamp(toIndexRaw, 0, container.cards.length);
            container.cards.splice(toIndex, 0, moved);
            setColumnsCache(next);
          }
        }

        // 변경 감지: beforeMap 1회 + 현재 캐시 순회
        if (!snapshot) return;
        const before = buildCardPositionMap(snapshot);
        const latest = getColumnsCache();

        const changed: Array<{ id: string; columnId: string; order: number }> =
          [];
        for (const col of latest) {
          for (let i = 0; i < col.cards.length; i++) {
            const cardId = col.cards[i].id;
            const prev = before.get(cardId);
            if (!prev || prev.columnId !== col.id || prev.order !== i) {
              changed.push({ id: cardId, columnId: col.id, order: i });
            }
          }
        }
        if (changed.length === 0) return;

        await Promise.all(
          changed.map((c) => kanbanApi.moveCard(c.id, c.columnId, c.order))
        );
        await queryClient.invalidateQueries({ queryKey: ["columns"] });
      } catch (e) {
        if (snapshot) setColumnsCache(snapshot);
        toast.error(
          (e as ApiError)?.message ?? "드래그 결과 저장에 실패했습니다."
        );
      } finally {
        setActiveId(null);
      }
    },
    [getColumnsCache, queryClient, setActiveId, setColumnsCache]
  );

  return { overlayCard, onDragStart, onDragCancel, onDragOver, onDragEnd };
}
