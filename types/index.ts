export interface HabitWithLogs {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: string;
  goal: number | null;
  category: string | null;
  reminderTime: string | null;
  archived: boolean;
  locked: boolean;
  sortOrder: number;
  createdAt: Date;
  logs: HabitLog[];
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  frozen: boolean;
  value: number | null;
}

export interface HabitFormData {
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  frequency: string;
  goal?: number;
  category?: string;
  reminderTime?: string | null;
}
