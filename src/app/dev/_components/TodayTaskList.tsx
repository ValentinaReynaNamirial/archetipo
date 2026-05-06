import type { TodayTask } from "@/lib/task";
import { TodayTaskCard } from "./TodayTaskCard";

export function TodayTaskList({ tasks }: { tasks: TodayTask[] }) {
  return (
    <section className="anim-fade-up anim-delay-2">
      <div className="list-header">
        <div className="list-eyebrow">Today</div>
        <div className="list-meta">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"} · in priority order
        </div>
      </div>
      <div className="task-list">
        {tasks.map((task, index) => (
          <TodayTaskCard key={task.id} task={task} index={index} />
        ))}
      </div>
    </section>
  );
}
