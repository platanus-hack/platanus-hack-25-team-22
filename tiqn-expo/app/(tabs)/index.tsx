import { StyleSheet, FlatList, View } from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const tasks = useQuery(api.tasks.get);

  if (!tasks) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Cargando...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Tareas de Convex DB</ThemedText>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <ThemedText style={styles.taskText}>
              {item.isCompleted ? '✓' : '○'} {item.text}
            </ThemedText>
          </View>
        )}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>No se encontraron tareas en la base de datos</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 40,
  },
  taskItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  taskText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.5,
  },
});
