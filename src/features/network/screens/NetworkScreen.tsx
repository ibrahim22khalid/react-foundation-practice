import { useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyView } from '../components/EmptyView';
import { ErrorView } from '../components/ErrorView';
import { LearningCard } from '../components/LearningCard';
import { LoadingView } from '../components/LoadingView';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
type LoaderMode = 'success' | 'empty' | 'error';

type NetworkLearningItem = {
  id: number;
  title: string;
  completed: boolean;
};

const SUCCESS_ITEMS: NetworkLearningItem[] = [
  { id: 1, title: 'Components and typed props', completed: true },
  { id: 2, title: 'State and event handlers', completed: false },
  { id: 3, title: 'Lists and keys', completed: false },
];

async function fakeLoadItems(mode: LoaderMode): Promise<NetworkLearningItem[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, 800));

  if (mode === 'error') {
    throw new Error('The fake loader failed intentionally.');
  }

  if (mode === 'empty') {
    return [];
  }

  return SUCCESS_ITEMS;
}

export default function NetworkScreen() {
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [items, setItems] = useState<NetworkLearningItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const visibleStatus = status === 'success' && items.length === 0 ? 'empty' : status;

  async function loadItems(mode: LoaderMode) {
    setStatus('loading');
    setItems([]);
    setErrorMessage(null);

    try {
      const returnedItems = await fakeLoadItems(mode);

      setItems(returnedItems);
      setStatus('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      setErrorMessage(message);
      setStatus('error');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Deterministic async loader</Text>
        <Text style={styles.status}>Status: {visibleStatus}</Text>

        <View style={styles.controls}>
          <Button
            title="Success"
            onPress={() => loadItems('success')}
            disabled={status === 'loading'}
          />
          <Button
            title="Empty"
            onPress={() => loadItems('empty')}
            disabled={status === 'loading'}
          />
          <Button
            title="Error"
            color="#dc2626"
            onPress={() => loadItems('error')}
            disabled={status === 'loading'}
          />
        </View>

        <View style={styles.result}>
          {status === 'idle' && (
            <Text style={styles.message}>Press a button to begin the request.</Text>
          )}

          {status === 'loading' && <LoadingView message="Loading learning items..." />}

          {status === 'error' && (
            <ErrorView message={errorMessage ?? 'An unknown error occurred.'} />
          )}

          {status === 'success' && items.length === 0 && (
            <EmptyView message="No learning items were returned." />
          )}

          {status === 'success' && items.length > 0 && (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <LearningCard title={item.title} completed={item.completed} />
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: 16,
    gap: 16,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  status: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  controls: {
    gap: 8,
  },
  result: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    color: '#4b5563',
    textAlign: 'center',
  },
  listContent: {
    gap: 12,
  },
});
