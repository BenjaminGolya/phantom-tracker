export interface HabitWithLogs {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: string;
  goal: number | null;
  category: string | null;
  reminderTime: string | null;
  archived: boolean;
  locked: boolean;
  createdAt: Date;
  logs: HabitLog[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  value: number | null;
}

export interface HabitFormData {
  name: string;
  icon: string;
  color: string;
  frequency: string;
  goal?: number;
  category?: string;
  reminderTime?: string | null;
}
