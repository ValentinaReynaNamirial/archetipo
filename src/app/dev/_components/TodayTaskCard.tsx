import type { TodayTask } from "@/lib/task";

function priorityClass(index: number): string {
  if (index === 0) return "priority-1";
  if (index === 1) return "priority-2";
  return "priority-3";
}

function delayClass(index: number): string {
  const n = Math.min(index + 2, 5);
  return `anim-delay-${n}`;
}

export function TodayTaskCard({
  task,
  index,
}: {
  task: TodayTask;
  index: number;
}) {
  const number = String(index + 1).padStart(2, "0");
  return (
    <article className={`task-card ${priorityClass(index)} anim-fade-up ${delayClass(index)}`}>
      <div className="task-head">
        <div className="task-priority-num">{number}</div>
        <div className="task-title-block">
          <div className="task-title">{task.title}</div>
          {task.description ? (
            <div className="task-description">{task.description}</div>
          ) : null}
        </div>
      </div>
      {task.rationale ? (
        <p className="task-rationale">{task.rationale}</p>
      ) : (
        <span className="no-rationale">No note from Valentina</span>
      )}
    </article>
  );
}
