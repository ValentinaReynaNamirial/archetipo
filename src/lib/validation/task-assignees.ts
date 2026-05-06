export type AssigneeDiff = {
  toAdd: string[];
  toRemove: string[];
};

export function computeAssigneeDiff(
  current: readonly string[],
  next: readonly string[]
): AssigneeDiff {
  const currentSet = new Set(current);
  const nextSet = new Set(next);
  const toAdd: string[] = [];
  for (const id of next) {
    if (!currentSet.has(id) && !toAdd.includes(id)) toAdd.push(id);
  }
  const toRemove: string[] = [];
  for (const id of current) {
    if (!nextSet.has(id) && !toRemove.includes(id)) toRemove.push(id);
  }
  return { toAdd, toRemove };
}
