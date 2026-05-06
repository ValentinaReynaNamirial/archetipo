"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "../../profiles/ConfirmDialog";
import { deleteTaskAction } from "./actions";
import type { TaskRowData } from "./TaskBoard";

export function DeleteTaskDialog({
  task,
  onClose,
}: {
  task: TaskRowData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = async () => {
    setBusy(true);
    setError(null);
    const result = await deleteTaskAction(task.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.formError ?? "Failed to delete task.");
      return;
    }
    router.refresh();
    onClose();
  };

  return (
    <ConfirmDialog
      variant="danger"
      eyebrow="Delete task"
      title={`Delete "${task.title}"?`}
      confirmLabel="Delete task"
      busy={busy}
      error={error}
      onCancel={onClose}
      onConfirm={onConfirm}
    >
      <p className="modal-text">
        This task will be removed from the sprint backlog. The action cannot be undone.
      </p>
    </ConfirmDialog>
  );
}
