import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

import type { NewLearningItemInput } from "../types/learningItem";

type LearningItemFormProps = {
  onSubmit: (input: NewLearningItemInput) => void;
};

export function LearningItemForm({ onSubmit }: LearningItemFormProps) {
  const [title, setTitle] = useState("");
  const [minutesText, setMinutesText] = useState("");
  const [description, setDescription] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const trimmedTitle = title.trim();
  const trimmedMinutes = minutesText.trim();
  const parsedMinutes = Number(trimmedMinutes);
  const isWholeNumber = /^\d+$/.test(trimmedMinutes) && Number.isInteger(parsedMinutes);

  const titleValidationError =
    trimmedTitle.length === 0 ? "Title is required." : trimmedTitle.length <= 2 ? "Title must be at least 3 characters long." : undefined;

  let minutesValidationError: string | undefined;

  if (!isWholeNumber) {
    minutesValidationError = "Minutes must be a whole number.";
  } else if (parsedMinutes < 5 || parsedMinutes > 240) {
    minutesValidationError = "Minutes must be between 5 and 240.";
  }

  const titleError = showValidation ? titleValidationError : undefined;
  const minutesError = showValidation ? minutesValidationError : undefined;

  function resetForm() {
    setTitle("");
    setMinutesText("");
    setDescription("");
    setShowValidation(false);
  }

  function handleSubmit() {
    setShowValidation(true);

    if (titleValidationError || minutesValidationError) {
      return;
    }

    const trimmedDescription = description.trim();

    onSubmit({
      title: trimmedTitle,
      minutes: parsedMinutes,
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
    });

    resetForm();
  }

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>Add a learning item</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          accessibilityLabel="Learning item title"
          value={title}
          onChangeText={setTitle}
          placeholder="Type a title"
          style={[styles.input, titleError && styles.invalidInput]}
          returnKeyType="next"
        />
        {__DEV__ ? (
          <Text style={styles.preview}>Current title: {title || "(empty)"}</Text>
        ) : null}
        {titleError ? <Text style={styles.error}>{titleError}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Minutes</Text>
        <TextInput
          accessibilityLabel="Learning item minutes"
          value={minutesText}
          onChangeText={setMinutesText}
          placeholder="5 to 240"
          inputMode="numeric"
          style={[styles.input, minutesError && styles.invalidInput]}
          returnKeyType="next"
        />
        {minutesError ? <Text style={styles.error}>{minutesError}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          accessibilityLabel="Learning item description"
          value={description}
          onChangeText={setDescription}
          placeholder="Add a short description"
          multiline
          numberOfLines={3}
          style={[styles.input, styles.descriptionInput]}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button title="Add item" onPress={handleSubmit} />
        </View>
        <View style={styles.action}>
          <Button title="Reset" color="#6b7280" onPress={resetForm} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    gap: 12,
  },
  heading: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#111827",
  },
  invalidInput: {
    borderColor: "#dc2626",
  },
  descriptionInput: {
    minHeight: 88,
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
  },
  preview: {
    color: "#6b7280",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  action: {
    flex: 1,
  },
});
