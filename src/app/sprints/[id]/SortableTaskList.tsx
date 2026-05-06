"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { reorderTasksAction } from "./actions";
import { SortableTaskRow } from "./SortableTaskRow";
import {
  arraysEqualInOrder,
  moveTaskToPosition,
} from "@/lib/validation/task-order";
import type { TaskRowData } from "./TaskBoard";

export function SortableTaskList({
  sprintId,
  tasks,
  onEdit,
  onDelete,
}: {
  sprintId: string;
  tasks: TaskRowData[];
  onEdit: (task: TaskRowData) => void;
  onDelete: (task: TaskRowData) => void;
}) {
  const [orderedTasks, setOrderedTasks] = useState<TaskRowData[]>(tasks);
  const [, startTransition] = useTransition();
  const lastServerOrderRef = useRef<string[]>(tasks.map((t) => t.id));

  useEffect(() => {
    setOrderedTasks(tasks);
    lastServerOrderRef.current = tasks.map((t) => t.id);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const persist = (nextIds: string[]) => {
    if (arraysEqualInOrder(lastServerOrderRef.current, nextIds)) return;

    const previous = orderedTasks;
    const byId = new Map(previous.map((t) => [t.id, t]));
    const nextOrdered = nextIds
      .map((id) => byId.get(id))
      .filter((t): t is TaskRowData => Boolean(t));

    setOrderedTasks(nextOrdered);
    const previousServerOrder = lastServerOrderRef.current;
    lastServerOrderRef.current = nextIds;

    startTransition(async () => {
      const result = await reorderTasksAction(sprintId, nextIds);
      if (!result.ok) {
        setOrderedTasks(previous);
        lastServerOrderRef.current = previousServerOrder;
        toast.error(result.error);
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedTasks.findIndex((t) => t.id === active.id);
    const newIndex = orderedTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextIds = arrayMove(orderedTasks, oldIndex, newIndex).map((t) => t.id);
    persist(nextIds);
  };

  const handlePositionCommit = (taskId: string, oneBasedPosition: number) => {
    const currentIds = orderedTasks.map((t) => t.id);
    const nextIds = moveTaskToPosition(currentIds, taskId, oneBasedPosition - 1);
    persist(nextIds);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={orderedTasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="backlog-list anim-fade-up anim-delay-2" data-testid="backlog-list">
          {orderedTasks.map((task, index) => (
            <SortableTaskRow
              key={task.id}
              task={task}
              position={index + 1}
              total={orderedTasks.length}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
              onPositionCommit={handlePositionCommit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
