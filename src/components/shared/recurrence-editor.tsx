"use client";

import { FREQUENCY_OPTIONS, WEEKDAYS_SHORT } from "@/lib/recurrence";
import type { Frequency, Recurrence } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Field, Select } from "../ui/field";

export function RecurrenceEditor({
  value,
  onChange,
}: {
  value: Recurrence;
  onChange: (r: Recurrence) => void;
}) {
  const setFreq = (frequency: Frequency) => onChange({ ...value, frequency });

  return (
    <div className="space-y-3">
      <Field label="Frecuencia">
        <Select
          value={value.frequency}
          onChange={(e) => setFreq(e.target.value as Frequency)}
        >
          {FREQUENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      {value.frequency === "monthly" ? (
        <Field label="Día del mes">
          <Select
            value={value.dayOfMonth ?? 1}
            onChange={(e) =>
              onChange({ ...value, dayOfMonth: Number(e.target.value) })
            }
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field label="Día de la semana">
          <div className="flex gap-1.5">
            {WEEKDAYS_SHORT.map((label, idx) => {
              const active = (value.weekday ?? 1) === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange({ ...value, weekday: idx })}
                  className={cn(
                    "h-9 flex-1 rounded-lg text-xs font-semibold transition-colors",
                    active
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  {label[0]}
                </button>
              );
            })}
          </div>
        </Field>
      )}
    </div>
  );
}
