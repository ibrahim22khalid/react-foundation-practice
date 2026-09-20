import { StyleSheet, Text } from 'react-native';

type EmptyViewProps = {
  message: string;
};

export function EmptyView({ message }: EmptyViewProps) {
  return <Text style={styles.message}>{message}</Text>;
}

const styles = StyleSheet.create({
  message: {
    color: '#4b5563',
    textAlign: 'center',
  },
});
