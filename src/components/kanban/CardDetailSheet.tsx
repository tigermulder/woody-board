import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
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
  DatePickerWithInput,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from "@/components/ui";
import { useKanbanDispatch } from "@/contexts/KanbanContext";
import { useCardActions } from "@/hooks/useCardActions";
import type { ApiError, CardType } from "@/types/api";

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  const hours24 = d.getHours();
  const period = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(
    d.getDate()
  )} ${period} ${pad2(hours12)}:${pad2(d.getMinutes())}`;
};

const cardFormSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다.")
    .max(100, "제목은 100자 이내여야 합니다."),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(),
});

type CardFormValues = z.infer<typeof cardFormSchema>;

export function CardDetailSheet({ card }: { card: CardType }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { update, remove } = useCardActions();
  const { setSelectedCardId } = useKanbanDispatch();

  const defaultValues = useMemo<CardFormValues>(
    () => ({
      title: card.title ?? "",
      description: card.description ?? "",
      dueDate: card.dueDate ?? "",
    }),
    [card.title, card.description, card.dueDate]
  );

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const onSubmit = (values: CardFormValues) => {
    const promise = update.mutateAsync({
      id: card.id,
      params: {
        title: values.title.trim(),
        description: values.description?.trim() || "",
        dueDate: values.dueDate ? values.dueDate : null,
      },
    });

    toast.promise(promise, {
      loading: "카드 수정 중...",
      success: () => "카드가 수정되었습니다.",
      error: (error) =>
        (error as ApiError)?.message ?? "카드 수정에 실패했습니다.",
    });
  };

  const handleDelete = () => {
    const promise = remove.mutateAsync(card.id);
    toast.promise(promise, {
      loading: "카드 삭제 중...",
      success: () => {
        setDeleteDialogOpen(false);
        setSelectedCardId(null);
        return "카드가 삭제되었습니다.";
      },
      error: (error) =>
        (error as ApiError)?.message ?? "카드 삭제에 실패했습니다.",
    });
  };

  return (
    <>
      <SheetContent className="flex flex-col gap-6">
        <SheetHeader>
          <SheetTitle>카드 상세</SheetTitle>
          <SheetDescription>
            카드 내용을 수정하거나 삭제할 수 있습니다.
          </SheetDescription>
        </SheetHeader>

        {/* 메타 정보 */}
        <div className="p-4">
          <div className="rounded-xl border bg-muted/20">
            <div className="divide-y">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="font-semibold text-foreground/80 text-xs">
                  마감일
                </div>
                <div className="whitespace-nowrap font-semibold text-foreground text-xs tabular-nums">
                  {formatDateTime(card.dueDate)}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="font-semibold text-foreground/80 text-xs">
                  생성일
                </div>
                <div className="whitespace-nowrap font-semibold text-foreground text-xs tabular-nums">
                  {formatDateTime(card.createdAt)}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="font-semibold text-foreground/80 text-xs">
                  수정일
                </div>
                <div className="whitespace-nowrap font-semibold text-foreground text-xs tabular-nums">
                  {formatDateTime(card.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-8 p-4"
          >
            <div className="flex-1 space-y-6">
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

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground/80 text-sm">
                      마감일
                    </FormLabel>
                    <FormControl>
                      <DatePickerWithInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={remove.isPending || update.isPending}
                        disablePast
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="flex-col gap-2 p-0 sm:flex-row">
              <Button
                type="button"
                size="lg"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={remove.isPending || update.isPending}
              >
                <Trash2 />
                Delete
              </Button>
              <Button
                type="button"
                size="lg"
                variant="secondary"
                onClick={() => setSelectedCardId(null)}
                disabled={remove.isPending || update.isPending}
              >
                Close
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={update.isPending || remove.isPending}
              >
                Update
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="overflow-hidden p-0 sm:max-w-[480px]">
          <div className="flex gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogHeader className="text-left">
                <AlertDialogTitle>카드를 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-semibold text-foreground">
                    {card.title}
                  </span>{" "}
                  카드가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </div>
          <AlertDialogFooter className="bg-muted/40 p-4 px-6">
            <AlertDialogCancel disabled={remove.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={remove.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
