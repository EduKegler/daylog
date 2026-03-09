"use client";

import { TaskItem, type Task } from "./task-item";

export function TaskList({
  title,
  tasks,
  emptyMessage,
}: {
  title: string;
  tasks: Task[];
  emptyMessage: string;
}) {
  if (tasks.length === 0) {
    return (
      <section className="task-section">
        <h2 className="section-title">{title}</h2>
        <p className="empty-message">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="task-section">
      <h2 className="section-title">
        {title}
        <span className="section-count">{tasks.length}</span>
      </h2>
      <div className="task-list">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
