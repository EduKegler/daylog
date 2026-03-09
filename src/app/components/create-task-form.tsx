"use client";

import { useRef, useState, useTransition } from "react";
import { createTaskAction } from "../actions";

export function CreateTaskForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createTaskAction(formData);
      formRef.current?.reset();
      setIsOpen(false);
    });
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="add-task-btn">
        <span className="add-icon">+</span>
        Nova tarefa
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="create-task-form">
      <input
        name="title"
        type="text"
        placeholder="O que precisa fazer?"
        required
        autoFocus
        className="task-input"
      />

      <div className="form-row">
        <input
          name="category"
          type="text"
          placeholder="Categoria (opcional)"
          className="task-input small"
        />
        <input
          name="scheduledDate"
          type="date"
          defaultValue={new Date().toISOString().split("T")[0]}
          className="task-input small"
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
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
