import { CalendarIcon } from "lucide-react";
import { format, isValid, parse, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerWithInputProps = {
  value: string | null | undefined;
  onChange: (nextValue: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
  name?: string;
  disablePast?: boolean;
  minDate?: Date;
};

function parseYyyyMmDd(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

// NOTE: "Input"이라고 이름은 남겨두되, 실제로는 타이핑 불가(캘린더 선택만) UX로 동작합니다.
export function DatePickerWithInput({
  value,
  onChange,
  disabled,
  placeholder = "마감일을 선택해 주세요",
  className,
  onBlur,
  name,
  disablePast,
  minDate,
}: DatePickerWithInputProps) {
  const [open, setOpen] = useState(false);
  const stringValue = value ?? "";

  const selectedDate = useMemo(() => {
    return parseYyyyMmDd(stringValue);
  }, [stringValue]);

  const label = selectedDate ? format(selectedDate, "yyyy-MM-dd") : placeholder;

  const computedMinDate = useMemo(() => {
    if (minDate) return startOfDay(minDate);
    if (disablePast) return startOfDay(new Date());
    return undefined;
  }, [disablePast, minDate]);

  return (
    <>
      {/* 폼 연동을 위해 name/value는 유지 (타이핑은 불가) */}
      {name ? (
        <input type="hidden" name={name} value={stringValue} readOnly />
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onBlur={onBlur}
            className={cn(
              "h-12 justify-between border-muted-foreground/20 px-3 font-normal text-sm",
              !selectedDate && "text-muted-foreground",
              className
            )}
          >
            <span className="truncate">{label}</span>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            disabled={computedMinDate ? { before: computedMinDate } : undefined}
            fromDate={computedMinDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
