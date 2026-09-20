import { Button, StyleSheet, Text, View } from 'react-native';

type LearningCardProps = {
  title: string;
  minutes: number;
  completed: boolean;
  onAddMinutes: () => void;
  onComplete: () => void;
  onRemove: () => void;
  description?: string;
};

export function LearningCard({
  title,
  minutes,
  completed,
  onAddMinutes,
  onComplete,
  onRemove,
  description,
}: LearningCardProps) {
  return (
    <View style={[styles.card, completed && styles.completedCard]}>
      <Text style={styles.title}>{title}</Text>

      {description ? <Text>{description}</Text> : null}

      <Text>{minutes} minutes</Text>
      <Text>{completed ? 'Lesson completed' : 'Not completed yet'}</Text>

      <Button title="Add 5 minutes" onPress={onAddMinutes} />
      <Button
        title={completed ? 'Completed' : 'Mark as complete'}
        onPress={onComplete}
        disabled={completed}
      />
      <Button title="Remove" color="#dc2626" onPress={onRemove} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  completedCard: {
    backgroundColor: '#dcfce7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
