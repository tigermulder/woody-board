import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Textarea,
} from "@/components/ui";
import { useCardActions } from "@/hooks/useCardActions";
import { useColumnActions } from "@/hooks/useColumnActions";
import { cn } from "@/lib/utils";
import type { ApiError, ColumnType } from "@/types/api.ts";

// Zod 스키마 정의
const cardFormSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다.")
    .max(100, "제목은 100자 이내여야 합니다."),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(),
});

type CardFormValues = z.infer<typeof cardFormSchema>;

const columnBgColors: Record<string, string> = {
  "To Do": "bg-slate-200/70 dark:bg-slate-800/70",
  "In Progress": "bg-blue-100 dark:bg-blue-900/40",
  Done: "bg-emerald-100 dark:bg-emerald-900/40",
};

export function Column({ column }: { column: ColumnType }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const { remove } = useColumnActions();
  const { add } = useCardActions();

  // 2. React Hook Form 초기화
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
    },
  });

  const bgColor =
    columnBgColors[column.title] || "bg-slate-100/50 dark:bg-slate-900/50";

  // 컬럼 삭제 핸들러
  const handleDelete = () => {
    const promise = remove.mutateAsync(column.id);
    toast.promise(promise, {
      loading: "컬럼 삭제 중...",
      success: (data) => {
        setDeleteDialogOpen(false);
        const deletedCardsCount = (data as any)?.deleted_cards_count ?? null;
        return deletedCardsCount === null
          ? "컬럼이 삭제되었습니다."
          : `컬럼이 삭제되었습니다. (카드 ${deletedCardsCount}개 포함)`;
      },
      error: (error) => (error as ApiError)?.message,
    });
  };

  // 카드 생성 핸들러
  const onSubmit = (values: CardFormValues) => {
    const promise = add.mutateAsync({
      columnId: column.id,
      title: values.title,
      description: values.description?.trim() || "",
      dueDate: values.dueDate || null,
    });

    toast.promise(promise, {
      loading: "카드 추가 중...",
      success: () => {
        setAddSheetOpen(false);
        form.reset(); // 폼 초기화
        return "카드가 추가되었습니다.";
      },
      error: (error) => (error as ApiError)?.message,
    });
  };

  return (
    <div
      className={cn(
        "flex w-80 shrink-0 flex-col gap-4 rounded-xl p-4",
        bgColor
      )}
    >
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-foreground text-lg">{column.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem className="cursor-pointer">
              수정하기{" "}
              <DropdownMenuShortcut>
                <Pencil className="h-3.5 w-3.5" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              삭제하기{" "}
              <DropdownMenuShortcut>
                <Trash2 className="h-3.5 w-3.5" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 컬럼 삭제 알럿 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="overflow-hidden p-0 sm:max-w-[480px]">
          <div className="flex gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogHeader className="text-left">
                <AlertDialogTitle>컬럼을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-semibold text-foreground">
                    {column.title}
                  </span>{" "}
                  내의 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
          <AlertDialogFooter className="bg-muted/40 p-4 px-6">
            <AlertDialogCancel disabled={remove.isPending}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={remove.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {remove.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "확인"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 카드 리스트 */}
      <div className="flex flex-col gap-3">
        {column.cards.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}
        {column.cards.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border-2 border-muted-foreground/10 border-dashed text-muted-foreground text-xs">
            카드가 없습니다
          </div>
        )}
      </div>

      {/* 카드 추가 */}
      <Sheet
        open={addSheetOpen}
        onOpenChange={(open) => {
          if (!open) form.reset(); // 닫힐 때 폼 초기화
          setAddSheetOpen(open);
        }}
      >
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="justify-start gap-2 text-muted-foreground"
            size="sm"
          >
            <span className="text-xl">+</span> 카드 추가
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col gap-6">
          <SheetHeader>
            <SheetTitle>카드 추가</SheetTitle>
            <SheetDescription>새로운 작업을 정의해 주세요.</SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-1 flex-col gap-8 p-4"
            >
              <div className="flex-1 space-y-6">
                {/* 제목 필드 */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground/80 text-sm">
                        제목
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="어떤 일을 해야 하나요?"
                          className="h-12 border-muted-foreground/20 focus-visible:ring-primary/30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-medium text-xs" />
                    </FormItem>
                  )}
                />

                {/* 설명 필드 */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground/80 text-sm">
                        설명
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="상세한 내용을 입력해 주세요."
                          className="min-h-[150px] resize-none border-muted-foreground/20 focus-visible:ring-primary/30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 마감일 필드 */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground/80 text-sm">
                        마감일
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="date"
                            className="h-12 border-muted-foreground/20 focus-visible:ring-primary/30"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="flex-row gap-2 p-0">
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="flex-1 font-bold"
                  onClick={() => setAddSheetOpen(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 font-bold"
                  disabled={add.isPending}
                >
                  {add.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>생성 중...</span>
                    </div>
                  ) : (
                    "카드 추가"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
