export type NotificationActionLabData = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  details: string;
};

export const notificationActionLabData: NotificationActionLabData = {
  id: "weekly-progress",
  title: "Weekly progress",
  description:
    "You completed 5 out of 7 planned habits this week. Open the notification to review your progress and next steps.",
  timeLabel: "2 hours ago",
  details:
    "You completed five of your seven planned habits this week. Your morning walk and evening reflection still need attention. Review your plan and choose one small action to complete today.",
};
