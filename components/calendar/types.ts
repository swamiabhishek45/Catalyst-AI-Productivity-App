export type CalendarView = "month" | "week";
export type ItemType = "task" | "reminder";
export type CategoryId = "focus" | "home" | "work" | "wellness" | "finance";

export type CalendarItem = {
  id: string;
  title: string;
  notes: string;
  date: string | null;
  time: string;
  type: ItemType;
  category: CategoryId;
};

export type DialogState = {
  date: string | null;
  item: CalendarItem | null;
};
