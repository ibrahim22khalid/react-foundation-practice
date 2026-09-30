import { learningItems as initialLearningItems } from "../types/learningItem";
import type { LearningItem } from "../types/learningItem";

export type SetLearningItemCompletedInput = {
  itemId: string;
  completed: boolean;
};

const DEFAULT_MUTATION_DELAY_MS = 800;

let serverLearningItems = cloneLearningItems(initialLearningItems);
let mutationDelayMs = DEFAULT_MUTATION_DELAY_MS;
let shouldFailNextMutation = false;

function cloneLearningItem(item: LearningItem): LearningItem {
  return { ...item };
}

function cloneLearningItems(items: LearningItem[]): LearningItem[] {
  return items.map(cloneLearningItem);
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function logRequest(message: string): void {
  if (__DEV__) {
    console.log(`[Learning items API] ${message}`);
  }
}

export async function listLearningItems(): Promise<LearningItem[]> {
  logRequest("List completed.");
  return cloneLearningItems(serverLearningItems);
}

export async function setLearningItemCompleted(
  input: SetLearningItemCompletedInput,
): Promise<LearningItem> {
  const failsThisRequest = shouldFailNextMutation;
  shouldFailNextMutation = false;

  logRequest(
    `Set completed started: ${input.itemId} -> ${String(input.completed)}.`,
  );

  await wait(mutationDelayMs);

  if (failsThisRequest) {
    logRequest(`Set completed failed: ${input.itemId}.`);
    throw new Error("The learning item could not be updated. Please try again.");
  }

  const itemIndex = serverLearningItems.findIndex(
    (item) => item.id === input.itemId,
  );

  if (itemIndex === -1) {
    logRequest(`Set completed failed: ${input.itemId} was not found.`);
    throw new Error("The learning item was not found.");
  }

  const updatedItem: LearningItem = {
    ...serverLearningItems[itemIndex],
    completed: input.completed,
  };

  serverLearningItems = serverLearningItems.map((item, index) =>
    index === itemIndex ? updatedItem : item,
  );

  logRequest(
    `Set completed succeeded: ${input.itemId} -> ${String(input.completed)}.`,
  );

  return cloneLearningItem(updatedItem);
}

export function setLearningItemMutationDelay(delayMs: number): void {
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new RangeError("The mutation delay must be a non-negative number.");
  }

  mutationDelayMs = delayMs;
}

export function failNextMutation(): void {
  shouldFailNextMutation = true;
}

export function resetLearningItemsApi(): void {
  serverLearningItems = cloneLearningItems(initialLearningItems);
  mutationDelayMs = DEFAULT_MUTATION_DELAY_MS;
  shouldFailNextMutation = false;
}
