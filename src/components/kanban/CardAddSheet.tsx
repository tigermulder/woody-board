import type { UseFormReturn } from "react-hook-form";
import type { CardFormValues } from "./Column";
import {
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

type CardAddSheetProps = {
  form: UseFormReturn<CardFormValues>;
  onSubmit: (values: CardFormValues) => void;
  isPending: boolean;
  onCancel: () => void;
};

export function CardAddSheet({
  form,
  onSubmit,
  isPending,
  onCancel,
}: CardAddSheetProps) {
  return (
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
                    <DatePickerWithInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isPending}
                      disablePast
                    />
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
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isPending}>
              Create
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </SheetContent>
  );
}
