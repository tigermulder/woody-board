import { Column } from "@/components/kanban/Column";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { Button, Input, ScrollArea, ScrollBar } from "@/components/ui";
import { useColumnActions } from "@/hooks/useColumnActions";
import { useColumns } from "@/hooks/useColumns";
import { cn } from "@/lib/utils";
import type { ApiError, ColumnType } from "@/types/api";
import { toast } from "sonner";

export function Board() {
  const { data: columns, isLoading, refetch } = useColumns();
  const { add } = useColumnActions();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  useLayoutEffect(() => {
    if (!isAdding) return;
    inputRef.current?.focus();
  }, [isAdding]);

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

  if (isLoading) return <div>Loading...</div>;
  return (
    <ScrollArea className="h-[calc(100vh-80px)] w-full">
      <div className="flex h-full w-max gap-6 p-6">
        {columns?.map((column: ColumnType) => (
          <Column key={column.id} column={column} />
        ))}

        {/* 새 컬럼 추가 버튼 */}
        <div
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
                  className="cursor-pointer"
                  onClick={reset}
                  disabled={add.isPending}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={add.isPending}
                >
                  확인
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="ghost"
              className="h-20 w-full cursor-pointer gap-2"
              onClick={() => setIsAdding(true)}
            >
              <span className="text-xl">+</span>
              <span className="font-medium">컬럼 추가</span>
            </Button>
          )}
        </div>
      </div>

      <ScrollBar orientation="horizontal" className="h-2.5" />
    </ScrollArea>
  );
}
