export type LearningItem = {
  id: string;
  title: string;
  minutes: number;
  completed: boolean;
  description?: string;
};

export const learningItems: LearningItem[] = [
  {
    id: 'lesson-1',
    title: 'Components and typed props',
    minutes: 45,
    completed: true,
    description: 'Practice building typed React components.',
  },
  {
    id: 'lesson-2',
    title: 'State and event handlers',
    minutes: 45,
    completed: false,
  },
  {
    id: 'lesson-3',
    title: 'Lists and keys',
    minutes: 45,
    completed: false,
  },
];
