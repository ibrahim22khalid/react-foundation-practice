import { StyleSheet, Text, View } from 'react-native';

type LearningCardProps = {
  title: string;
  completed: boolean;
};

export function LearningCard({ title, completed }: LearningCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text>{completed ? 'Completed' : 'Not completed'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    gap: 8,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});
