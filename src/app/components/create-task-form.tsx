"use client";

import { useRef, useState } from "react";
import { useCreateTask } from "@/lib/queries/daily";

export function CreateTaskForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const createTask = useCreateTask();

  function handleSubmit(formData: FormData) {
    setErrors({});
    createTask.mutate(formData, {
      onSuccess: (result) => {
        if (result.success) {
          formRef.current?.reset();
          setErrors({});
          setIsOpen(false);
        } else if (result.errors) {
          setErrors(result.errors);
        }
      },
    });
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 w-full py-3.5 text-subtext text-muted bg-transparent border-0 border-b border-border transition-colors duration-200 hover:text-accent">
        <span className="text-icon leading-none">+</span>
        New task
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3 py-4 border-b border-border">
      <input
        name="title"
        type="text"
        placeholder="What do you need to do?"
        required
        autoFocus
        className="w-full py-2 text-body bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted"
      />
      {errors.title && (
        <p className="text-small text-red-600 mt-1">{errors.title}</p>
      )}

      <div className="flex gap-4">
        <input
          name="category"
          type="text"
          placeholder="Category (optional)"
          className="w-full py-2 text-small bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted"
        />
        <input
          name="scheduledDate"
          type="date"
          defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`}
          className="w-full py-2 text-small bg-transparent border-0 border-b border-border outline-none text-stone-900 transition-[border-color] duration-200 focus:border-b-accent placeholder:text-muted"
        />
      </div>
      {errors.category && (
        <p className="text-small text-red-600 mt-1">{errors.category}</p>
      )}
      {errors.scheduledDate && (
        <p className="text-small text-red-600 mt-1">{errors.scheduledDate}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setErrors({});
          }}
          className="text-small text-muted bg-transparent border-none py-1.5 px-3 hover:text-stone-900"
        >
          Cancel
        </button>
        <button type="submit" disabled={createTask.isPending} className="text-small font-medium text-white bg-accent border-none rounded-md py-1.5 px-4 transition-[background] duration-200 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed">
          {createTask.isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
