import { useLocalSearchParams } from "expo-router";

import NavigationLabDetailScreen from "@/features/navigation-lab/screens/NavigationLabDetailScreen";

export default function NavigationLabDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <NavigationLabDetailScreen id={id} />;
}
