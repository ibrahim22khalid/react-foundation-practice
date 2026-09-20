import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type LoadingViewProps = {
  message: string;
};

export function LoadingView({ message }: LoadingViewProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  message: {
    color: '#4b5563',
    textAlign: 'center',
  },
});
