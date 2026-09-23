import { Stack } from "expo-router";

export default function NavigationLabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Navigation Lab" }} />
      <Stack.Screen name="[id]" options={{ title: "Learning Item" }} />
    </Stack>
  );
}
