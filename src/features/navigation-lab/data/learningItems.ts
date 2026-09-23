export type NavigationLearningItemId =
  | "effects"
  | "async-cleanup"
  | "screen-focus";

export type NavigationLearningItem = {
  id: NavigationLearningItemId;
  title: string;
  minutes: number;
};

export const navigationLearningItems: readonly NavigationLearningItem[] = [
  {
    id: "effects",
    title: "Understanding Effects",
    minutes: 40,
  },
  {
    id: "async-cleanup",
    title: "Async Cleanup",
    minutes: 50,
  },
  {
    id: "screen-focus",
    title: "Screen Focus",
    minutes: 45,
  },
];
