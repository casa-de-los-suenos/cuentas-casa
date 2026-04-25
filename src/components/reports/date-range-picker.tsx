"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from: Date;
  to: Date;
  onRangeChange: (range: { from: Date; to: Date }) => void;
}

export default function DateRangePicker({
  from,
  to,
  onRangeChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedRange: DateRange = { from, to };

  const applyPreset = (preset: { from: Date; to: Date }) => {
    onRangeChange(preset);
    setOpen(false);
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onRangeChange({ from: range.from, to: range.to ?? range.from });
    }
  };

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const formatLabel = () => {
    const fromLabel = format(from, "dd MMM yyyy", { locale: es });
    const toLabel = format(to, "dd MMM yyyy", { locale: es });
    if (fromLabel === toLabel) return fromLabel;
    return `${fromLabel} — ${toLabel}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-w-[240px]",
            !from && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex gap-2 p-3 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              applyPreset({ from: today, to: today })
            }
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              applyPreset({ from: yesterday, to: yesterday })
            }
          >
            Ayer
          </Button>
        </div>
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={handleSelect}
          numberOfMonths={1}
          locale={es}
          disabled={{ after: today }}
        />
      </PopoverContent>
    </Popover>
  );
}
