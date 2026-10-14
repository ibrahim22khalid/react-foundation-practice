import { render, screen, userEvent } from "@testing-library/react-native";

import { MotionProgressLab } from "../MotionProgressLab";

const TITLE =
  "Building adaptive and accessible React Native interfaces with purposeful motion";
const PROGRESS_NAME = `${TITLE} progress`;

describe("MotionProgressLab", () => {
  test("Continue updates the visible and accessible progress", async () => {
    const user = userEvent.setup();
    await render(<MotionProgressLab />);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("50% complete")).toBeOnTheScreen();
    expect(
      screen.getByRole("progressbar", {
        name: PROGRESS_NAME,
        value: { min: 0, max: 100, now: 50 },
      }),
    ).toBeOnTheScreen();
  });

  test("several rapid presses finish at the latest progress", async () => {
    const user = userEvent.setup();
    await render(<MotionProgressLab />);
    const continueAction = screen.getByRole("button", { name: "Continue" });

    await user.press(continueAction);
    await user.press(continueAction);
    await user.press(continueAction);

    expect(screen.getByText("100% complete")).toBeOnTheScreen();
    expect(
      screen.getByRole("progressbar", {
        name: PROGRESS_NAME,
        value: { min: 0, max: 100, now: 100 },
      }),
    ).toBeOnTheScreen();
  });

  test("progress stays capped at 100 percent", async () => {
    const user = userEvent.setup();
    await render(<MotionProgressLab />);
    const continueAction = screen.getByRole("button", { name: "Continue" });

    await user.press(continueAction);
    await user.press(continueAction);
    await user.press(continueAction);
    await user.press(continueAction);

    expect(screen.queryByText("125% complete")).not.toBeOnTheScreen();
    expect(
      screen.getByRole("progressbar", {
        name: PROGRESS_NAME,
        value: { min: 0, max: 100, now: 100 },
      }),
    ).toBeOnTheScreen();
  });

  test("Continue becomes disabled at completion", async () => {
    const user = userEvent.setup();
    await render(<MotionProgressLab />);
    const continueAction = screen.getByRole("button", { name: "Continue" });

    await user.press(continueAction);
    await user.press(continueAction);
    await user.press(continueAction);

    expect(
      screen.getByRole("button", { name: "Continue", disabled: true }),
    ).toBeDisabled();
  });

  test("Reset progress restores the initial value", async () => {
    const user = userEvent.setup();
    await render(<MotionProgressLab />);

    await user.press(screen.getByRole("button", { name: "Continue" }));
    await user.press(screen.getByRole("button", { name: "Continue" }));
    await user.press(screen.getByRole("button", { name: "Reset progress" }));

    expect(screen.getByText("25% complete")).toBeOnTheScreen();
    expect(
      screen.getByRole("progressbar", {
        name: PROGRESS_NAME,
        value: { min: 0, max: 100, now: 25 },
      }),
    ).toBeOnTheScreen();
  });

  test("keeps the long title visible", async () => {
    await render(<MotionProgressLab />);

    expect(screen.getByText(TITLE)).toBeOnTheScreen();
  });

  test("remains operable without controlling animation timing", async () => {
    const user = userEvent.setup();
    await render(<MotionProgressLab />);

    await user.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("50% complete")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Reset progress" }));

    expect(screen.getByText("25% complete")).toBeOnTheScreen();
  });
});
