import { StyleSheet, Text } from 'react-native';

type ErrorViewProps = {
  message: string;
};

export function ErrorView({ message }: ErrorViewProps) {
  return <Text style={styles.message}>{message}</Text>;
}

const styles = StyleSheet.create({
  message: {
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
  },
});
