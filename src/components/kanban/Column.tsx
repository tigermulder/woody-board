import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { CardItem } from "@/components/kanban/CardItem";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useColumnActions } from "@/hooks/useColumnActions";
import { cn } from "@/lib/utils";
import type { ApiError, ColumnType } from "@/types/api.ts";
import { toast } from "sonner";

const columnBgColors: Record<string, string> = {
  "To Do": "bg-slate-200/70 dark:bg-slate-800/70",
  "In Progress": "bg-blue-100 dark:bg-blue-900/40",
  Done: "bg-emerald-100 dark:bg-emerald-900/40",
};

export function Column({ column }: { column: ColumnType }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { remove } = useColumnActions();
  // 매칭되는 게 없으면 기본 색상 적용
  const bgColor =
    columnBgColors[column.title] || "bg-slate-100/50 dark:bg-slate-900/50";

  const handleDelete = () => {
    const promise = remove.mutateAsync(column.id);
    toast.promise(promise, {
      loading: "컬럼 삭제 중...",
      success: (data) => {
        setDeleteDialogOpen(false);
        const deletedCardsCount =
          typeof data === "object" &&
          data !== null &&
          "deleted_cards_count" in data
            ? Number(
                (data as { deleted_cards_count?: unknown })
                  .deleted_cards_count ?? 0
              )
            : null;
        return deletedCardsCount === null
          ? "컬럼이 삭제되었습니다."
          : `컬럼이 삭제되었습니다. (카드 ${deletedCardsCount}개 포함)`;
      },
      error: (error) => (error as ApiError)?.message,
    });
    return promise;
  };

  return (
    <div
      className={cn(
        "flex w-80 shrink-0 flex-col gap-4 rounded-xl p-4 transition-colors",
        "cursor-grab active:cursor-grabbing",
        bgColor
      )}
    >
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-foreground text-lg">{column.title}</h3>
        {/* 컬럼 액션 메뉴 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">컬럼 메뉴</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-30">
            <DropdownMenuItem className="cursor-pointer gap-2">
              수정하기
              <DropdownMenuShortcut>
                <Pencil className="h-3.5 w-3.5 opacity-70" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={remove.isPending}
            >
              삭제하기
              <DropdownMenuShortcut>
                <Trash2 className="h-3.5 w-3.5 opacity-70" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (remove.isPending) return;
          setDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent className="overflow-hidden p-0 sm:max-w-[680px]">
          <div className="flex gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <AlertDialogHeader className="gap-2 text-left">
                <AlertDialogTitle className="font-bold text-2xl leading-tight">
                  컬럼 삭제할까요?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base leading-relaxed">
                  <span className="font-medium text-foreground">
                    {column.title}
                  </span>
                  을(를) 삭제합니다. 카드{" "}
                  <span className="font-medium text-foreground">
                    {column.cards.length}개
                  </span>
                  도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>

          <div className="border-t bg-muted/40 px-6 py-4">
            <AlertDialogFooter className="gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AlertDialogCancel
                disabled={remove.isPending}
                className="h-11 px-8"
              >
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={remove.isPending}
                className="h-11 cursor-pointer bg-destructive px-10 text-destructive-foreground hover:bg-destructive/90"
              >
                {remove.isPending ? (
                  "삭제 중..."
                ) : (
                  <span className="text-white">확인</span>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 카드 리스트 (ScrollArea 적용 예정 구역) */}
      <div className="flex flex-col gap-3">
        {column.cards.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}

        {/* 카드가 하나도 없을 때 보여줄 안내 */}
        {column.cards.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-muted-foreground/10 border-dashed text-muted-foreground text-xs">
            카드가 없습니다
          </div>
        )}
      </div>

      {/* 카드 추가 버튼 */}
      <Button
        variant="ghost"
        className="cursor-pointer justify-start gap-2 text-muted-foreground hover:bg-background/50"
        size="sm"
      >
        <span className="text-xl">+</span> 카드 추가
      </Button>
    </div>
  );
}
