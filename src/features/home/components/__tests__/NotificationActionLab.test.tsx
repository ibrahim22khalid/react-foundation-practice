import { render, screen, userEvent } from "@testing-library/react-native";

import { NotificationActionLab } from "../NotificationActionLab";

describe("NotificationActionLab", () => {
  test("calls Open details once when the notification row is pressed", async () => {
    const user = userEvent.setup();
    const onOpenDetails = jest.fn();
    const onMarkAsRead = jest.fn();

    await render(
      <NotificationActionLab
        title="Weekly progress"
        description="You completed 5 out of 7 planned habits this week."
        timeLabel="2 hours ago"
        onOpenDetails={onOpenDetails}
        onMarkAsRead={onMarkAsRead}
      />,
    );

    await user.press(
      screen.getByRole("button", {
        name: "Open Weekly progress details",
      }),
    );

    expect(onOpenDetails).toHaveBeenCalledTimes(1);
    expect(onMarkAsRead).not.toHaveBeenCalled();
  });

  test("calls Mark as read once when its separate action is pressed", async () => {
    const user = userEvent.setup();
    const onOpenDetails = jest.fn();
    const onMarkAsRead = jest.fn();

    await render(
      <NotificationActionLab
        title="Weekly progress"
        description="You completed 5 out of 7 planned habits this week."
        timeLabel="2 hours ago"
        onOpenDetails={onOpenDetails}
        onMarkAsRead={onMarkAsRead}
      />,
    );

    await user.press(
      screen.getByRole("button", {
        name: "Mark Weekly progress as read",
      }),
    );

    expect(onMarkAsRead).toHaveBeenCalledTimes(1);
    expect(onOpenDetails).not.toHaveBeenCalled();
    expect(screen.getByText("Read")).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", {
        name: "Mark Weekly progress as read",
      }),
    ).not.toBeOnTheScreen();
  });

  test("keeps long notification content present", async () => {
    const longDescription =
      "You completed five of your seven planned habits this week, and this longer notification content must remain available on narrow screens and with large text enabled.";

    await render(
      <NotificationActionLab
        title="Weekly progress"
        description={longDescription}
        timeLabel="2 hours ago"
        onOpenDetails={jest.fn()}
        onMarkAsRead={jest.fn()}
      />,
    );

    expect(screen.getByText(longDescription)).toBeOnTheScreen();
  });
});
