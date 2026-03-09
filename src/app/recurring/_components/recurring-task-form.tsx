"use client";

import { useRef, useState, useTransition } from "react";
import { createRecurringTask, type ActionResult } from "@/lib/tasks/actions";

const WEEKDAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export function RecurringTaskForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [recurrenceType, setRecurrenceType] = useState("DAILY");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  function buildConfig(): string | null {
    if (recurrenceType === "SPECIFIC_WEEKDAYS") {
      return JSON.stringify({ days: selectedDays });
    }
    if (recurrenceType === "MONTHLY") {
      return JSON.stringify({ dayOfMonth });
    }
    return null;
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleSubmit(formData: FormData) {
    const config = buildConfig();
    if (config) {
      formData.set("recurrenceConfig", config);
    }
    formData.set("recurrenceType", recurrenceType);

    startTransition(async () => {
      const result: ActionResult = await createRecurringTask(formData);
      if (result.success) {
        formRef.current?.reset();
        setRecurrenceType("DAILY");
        setSelectedDays([]);
        setDayOfMonth(1);
        setErrors({});
        setIsOpen(false);
      } else if (result.errors) {
        setErrors(result.errors);
      }
    });
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="add-task-btn">
        <span className="add-icon">+</span>
        Nova tarefa recorrente
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="create-task-form">
      <div>
        <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
          Título
        </label>
        <input
          name="title"
          type="text"
          placeholder="O que se repete?"
          required
          autoFocus
          className="task-input"
        />
        {errors.title && (
          <p className="text-xs text-red-600 mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
          Descrição (opcional)
        </label>
        <input
          name="description"
          type="text"
          placeholder="Detalhes adicionais"
          className="task-input"
        />
      </div>

      <div className="form-row">
        <div className="flex-1">
          <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
            Categoria
          </label>
          <input
            name="category"
            type="text"
            placeholder="Opcional"
            className="task-input small"
          />
        </div>

        <div className="flex-1">
          <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
            Recorrência
          </label>
          <select
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value)}
            className="task-input small"
          >
            <option value="DAILY">Todos os dias</option>
            <option value="WEEKDAYS">Dias úteis</option>
            <option value="SPECIFIC_WEEKDAYS">Dias específicos</option>
            <option value="MONTHLY">Mensal</option>
          </select>
          {errors.recurrenceType && (
            <p className="text-xs text-red-600 mt-1">{errors.recurrenceType}</p>
          )}
        </div>
      </div>

      {recurrenceType === "SPECIFIC_WEEKDAYS" && (
        <div>
          <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium mb-2 block">
            Dias da semana
          </label>
          <div className="flex gap-1">
            {WEEKDAYS.map((wd) => (
              <button
                key={wd.value}
                type="button"
                onClick={() => toggleDay(wd.value)}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-colors duration-200 ${
                  selectedDays.includes(wd.value)
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-border)] text-[var(--color-muted)] hover:bg-stone-300"
                }`}
              >
                {wd.label}
              </button>
            ))}
          </div>
          {errors.recurrenceConfig && (
            <p className="text-xs text-red-600 mt-1">{errors.recurrenceConfig}</p>
          )}
        </div>
      )}

      {recurrenceType === "MONTHLY" && (
        <div>
          <label className="text-[0.6875rem] uppercase tracking-wider text-[var(--color-muted)] font-medium">
            Dia do mês
          </label>
          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
            className="task-input small"
            style={{ maxWidth: "5rem" }}
          />
          {errors.recurrenceConfig && (
            <p className="text-xs text-red-600 mt-1">{errors.recurrenceConfig}</p>
          )}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setErrors({});
          }}
          className="btn-cancel"
        >
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="btn-submit">
          {isPending ? "Criando..." : "Criar"}
        </button>
      </div>
    </form>
  );
}
