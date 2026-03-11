"use client";

import { useRef, useState, useTransition } from "react";
import { createTaskAction } from "../actions";
import type { ActionResult } from "@/lib/tasks/actions";

export function CreateTaskForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result: ActionResult = await createTaskAction(formData);
      if (result.success) {
        formRef.current?.reset();
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
        New task
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="create-task-form">
      <input
        name="title"
        type="text"
        placeholder="What do you need to do?"
        required
        autoFocus
        className="task-input"
      />
      {errors.title && (
        <p className="text-xs text-red-600 mt-1">{errors.title}</p>
      )}

      <div className="form-row">
        <input
          name="category"
          type="text"
          placeholder="Category (optional)"
          className="task-input small"
        />
        <input
          name="scheduledDate"
          type="date"
          defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`}
          className="task-input small"
        />
      </div>
      {errors.category && (
        <p className="text-xs text-red-600 mt-1">{errors.category}</p>
      )}
      {errors.scheduledDate && (
        <p className="text-xs text-red-600 mt-1">{errors.scheduledDate}</p>
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
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="btn-submit">
          {isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
