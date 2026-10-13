import { render, screen, userEvent } from "@testing-library/react-native";

import { LearningProgressCard } from "../LearningProgressCard";

// Verify the primary information that a user can read from the card.
describe("LearningProgressCard", () => {
  test("shows the title and textual progress", async () => {
    await render(
      <LearningProgressCard
        title="Accessible React Native"
        completedMinutes={30}
        totalMinutes={60}
        actionLabel="Resume lesson"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Accessible React Native")).toBeOnTheScreen();
    expect(screen.getByText("50% complete")).toBeOnTheScreen();
  });
  // Verify the semantic progress role, name, and numeric range.
  test("exposes the correct accessible progress value", async () => {
    await render(
      <LearningProgressCard
        title="Accessible React Native"
        completedMinutes={30}
        totalMinutes={60}
        actionLabel="Resume lesson"
        onPress={jest.fn()}
      />,
    );

    const progress = screen.getByRole("progressbar", {
      name: "Accessible React Native progress",
      value: {
        min: 0,
        max: 100,
        now: 50,
      },
    });

    expect(progress).toBeOnTheScreen();
  });
  // Verify that assistive technologies can discover the action by role and name.
  test("exposes the action by button role and accessible name", async () => {
    await render(
      <LearningProgressCard
        title="Accessible React Native"
        completedMinutes={30}
        totalMinutes={60}
        actionLabel="Resume lesson"
        onPress={jest.fn()}
      />,
    );

    const action = screen.getByRole("button", {
      name: "Resume lesson",
    });

    expect(action).toBeOnTheScreen();
  });
  // Verify that an enabled action forwards one realistic user press.
  test("calls onPress once when the enabled action is pressed", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();

    await render(
      <LearningProgressCard
        title="Accessible React Native"
        completedMinutes={30}
        totalMinutes={60}
        actionLabel="Resume lesson"
        onPress={onPress}
      />,
    );

    const action = screen.getByRole("button", {
      name: "Resume lesson",
    });

    await user.press(action);

    expect(onPress).toHaveBeenCalledTimes(1);
  });
  // Verify that the disabled state is exposed and blocks user interaction.
  test("exposes disabled state and prevents onPress", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();

    await render(
      <LearningProgressCard
        title="Advanced responsive layouts"
        completedMinutes={15}
        totalMinutes={60}
        actionLabel="Resume locked lesson"
        disabled
        onPress={onPress}
      />,
    );

    const action = screen.getByRole("button", {
      name: "Resume locked lesson",
      disabled: true,
    });

    expect(action).toBeDisabled();

    await user.press(action);

    expect(onPress).not.toHaveBeenCalled();
  });
  // Verify that a long title remains fully represented in the rendered output.
  test("keeps a long title present", async () => {
    const longTitle =
      "Building adaptive and accessible React Native interfaces for narrow screens and large system text";

    await render(
      <LearningProgressCard
        title={longTitle}
        completedMinutes={45}
        totalMinutes={90}
        actionLabel="Continue the adaptive accessibility lesson"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText(longTitle)).toBeOnTheScreen();
  });
  // Verify that invalid and out-of-range minute values stay safe and clamped.
  test.each([
    ["negative completed minutes", -10, 60, 0],
    ["completed minutes above total", 90, 60, 100],
    ["zero total minutes", 10, 0, 0],
    ["negative total minutes", 10, -60, 0],
    ["NaN completed minutes", Number.NaN, 60, 0],
    ["infinite total minutes", 10, Number.POSITIVE_INFINITY, 0],
  ])(
    "returns safe progress for %s",
    async (_case, completedMinutes, totalMinutes, expectedPercentage) => {
      await render(
        <LearningProgressCard
          title="Safe progress"
          completedMinutes={completedMinutes}
          totalMinutes={totalMinutes}
          actionLabel="Continue"
          onPress={jest.fn()}
        />,
      );

      expect(
        screen.getByText(`${expectedPercentage}% complete`),
      ).toBeOnTheScreen();

      expect(
        screen.getByRole("progressbar", {
          value: {
            min: 0,
            max: 100,
            now: expectedPercentage,
          },
        }),
      ).toBeOnTheScreen();
    },
  );
});
