import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";
import { kanbanApi } from "@/api/kanban";
import { Column } from "@/components/kanban/Column";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Button,
  Input,
  ScrollArea,
  ScrollBar,
  Skeleton,
} from "@/components/ui";
import { useKanbanDispatch, useKanbanState } from "@/contexts/KanbanContext";
import { useColumnActions } from "@/hooks/useColumnActions";
import { useColumns } from "@/hooks/useColumns";
import { cn } from "@/lib/utils";
import type { ApiError, CardType, ColumnType } from "@/types/api";

type ColumnsData = ColumnType[] | undefined;

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

export function Board() {
  const { activeId } = useKanbanState();
  const {
    data: columns,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useColumns({ pauseRefetch: Boolean(activeId) });
  const { add } = useColumnActions();
  const queryClient = useQueryClient();
  const { setActiveId } = useKanbanDispatch();
  const snapshotRef = useRef<ColumnType[] | null>(null);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const addColumnRef = useRef<HTMLDivElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const setColumnsCache = (next: ColumnType[]) => {
    queryClient.setQueryData<ColumnsData>(["columns"], next);
  };

  const getColumnsCache = () =>
    queryClient.getQueryData<ColumnsData>(["columns"]) ?? columns ?? [];

  useLayoutEffect(() => {
    if (!isAdding) return;
    inputRef.current?.focus();
  }, [isAdding]);

  useEffect(() => {
    if (!isAdding) return;

    const onPointerDown = (event: PointerEvent) => {
      if (add.isPending) return;
      const container = addColumnRef.current;
      const target = event.target as Node | null;
      if (!container || !target) return;
      if (!container.contains(target)) {
        setTitle("");
        setIsAdding(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [isAdding, add.isPending]);

  const reset = () => {
    setTitle("");
    setIsAdding(false);
  };

  const submit = async () => {
    const trimmed = title.trim();
    const promise = add.mutateAsync(trimmed).then(async (data) => {
      await refetch();
      reset();
      return data;
    });

    toast.promise(promise, {
      loading: "컬럼 생성 중...",
      success: () => "컬럼이 생성되었습니다.",
      error: (error) =>
        (error as ApiError)?.message ?? "컬럼 생성에 실패했습니다.",
    });

    return await promise;
  };

  // 스켈레톤 UI
  if (isLoading) {
    return (
      <ScrollArea className="h-[calc(100vh-80px)] w-full">
        <div className="flex h-full w-max gap-6 p-6">
          {Array.from({ length: 3 }).map((_, colIdx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
              key={colIdx}
              className={cn(
                "flex w-80 shrink-0 flex-col gap-4 rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm backdrop-blur-sm",
                "dark:border-white/10 dark:bg-slate-900/40"
              )}
            >
              {/* column header cap */}
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-2 py-2 dark:bg-white/5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>

              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((__, cardIdx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                    key={cardIdx}
                    className="rounded-xl border border-border/50 bg-card p-4 shadow-sm dark:border-white/10"
                  >
                    <Skeleton className="h-4 w-3/4" />
                    <div className="mt-3 flex items-center justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="mt-2">
                      <Skeleton className="h-1 w-full" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-muted/30 p-2 dark:bg-white/5">
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-2.5" />
      </ScrollArea>
    );
  }

  if (isError) {
    const isNetworkError = error.code === "NETWORK_ERROR";
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-xl">
          {isNetworkError ? <WifiOff /> : null}
          <AlertTitle>데이터를 불러오지 못했습니다</AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                재시도
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const overlayCard: CardType | null = (() => {
    if (!activeId || !columns) return null;
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === activeId);
      if (found) return found;
    }
    return null;
  })();

  const OverlayCard = ({ card }: { card: CardType }) => {
    return (
      <div className="pointer-events-none">
        <div className="w-80">
          {/* DragOverlay 안에서는 sortable/Sheet 트리거 충돌을 피하기 위해 단순 렌더링 */}
          <div className="group flex min-h-[120px] cursor-grabbing flex-col rounded-xl border bg-white shadow-md dark:bg-slate-800">
            <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
              <div className="min-w-0">
                <div className="line-clamp-2 font-bold text-foreground/90 text-sm leading-snug">
                  {card.title}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-80px)] w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => {
          setActiveId(String(active.id));
          snapshotRef.current = shallowCloneColumns(getColumnsCache());
        }}
        onDragCancel={() => {
          const snapshot = snapshotRef.current;
          if (snapshot) setColumnsCache(snapshot);
          snapshotRef.current = null;
          setActiveId(null);
        }}
        onDragOver={({ active, over }) => {
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

          const fromIndex = source.cards.findIndex(
            (c) => c.id === activeCardId
          );
          if (fromIndex < 0) return;
          const [moved] = source.cards.splice(fromIndex, 1);

          const overIsContainer = overContainerId === overId;
          const toIndexRaw = overIsContainer
            ? target.cards.length
            : target.cards.findIndex((c) => c.id === overId);
          const toIndex = clamp(toIndexRaw, 0, target.cards.length);
          target.cards.splice(toIndex, 0, moved);

          setColumnsCache(next);
        }}
        onDragEnd={async ({ active, over }) => {
          const snapshot = snapshotRef.current;
          snapshotRef.current = null;

          try {
            // 보드 밖/드롭 불가 영역에 놓으면(= over가 null) 낙관적 변경을 롤백해서 "취소"로 처리
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

            // 같은 컨테이너 내 reorder는 여기서 확정
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

            // 서버에는 "변경된 카드들"만 move로 반영 (서버가 reorder를 안 해줘도 정합성 유지)
            if (!snapshot) return;
            const before = buildCardPositionMap(snapshot);
            const after = buildCardPositionMap(getColumnsCache());

            const changed: Array<{
              id: string;
              columnId: string;
              order: number;
            }> = [];
            for (const [cardId, pos] of after) {
              const prev = before.get(cardId);
              if (
                !prev ||
                prev.columnId !== pos.columnId ||
                prev.order !== pos.order
              ) {
                changed.push({
                  id: cardId,
                  columnId: pos.columnId,
                  order: pos.order,
                });
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
        }}
      >
        <div className="flex h-full w-max gap-6 p-6">
          {columns?.map((column: ColumnType) => (
            <Column key={column.id} column={column} />
          ))}

          {/* 새 컬럼 추가 버튼 */}
          <div
            ref={addColumnRef}
            className={cn(
              "h-fit w-80 shrink-0 rounded-xl border-2 p-3 transition-all",
              isAdding
                ? "border-border bg-background shadow-sm ring-2 ring-primary/20"
                : "border-dashed opacity-60 hover:opacity-100"
            )}
          >
            {isAdding ? (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <label htmlFor={inputId} className="sr-only">
                  컬럼 제목
                </label>
                <Input
                  id={inputId}
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="컬럼 제목 입력 (Enter로 생성)"
                  disabled={add.isPending}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      if (!add.isPending) reset();
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    disabled={add.isPending}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={add.isPending}>
                    확인
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="ghost"
                className="h-20 gap-2"
                onClick={() => setIsAdding(true)}
              >
                <span className="text-xl">+</span>
                <span className="font-medium">컬럼 추가</span>
              </Button>
            )}
          </div>
        </div>

        <DragOverlay>
          {overlayCard ? <OverlayCard card={overlayCard} /> : null}
        </DragOverlay>
      </DndContext>

      <ScrollBar orientation="horizontal" className="h-2.5" />
    </ScrollArea>
  );
}
