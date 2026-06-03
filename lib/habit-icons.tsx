import {
  Droplets, Dumbbell, BookOpen, Brain, Heart, Moon, Sun, Zap,
  Music2, PenLine, Code2, Coffee, Apple, Bike, Footprints, Leaf,
  Star, Target, Clock, Smile, type LucideIcon,
} from "lucide-react";

export const HABIT_ICONS: { name: string; Icon: LucideIcon; label: string }[] = [
  { name: "Target",    Icon: Target,    label: "Focus"      },
  { name: "Heart",     Icon: Heart,     label: "Health"     },
  { name: "Dumbbell",  Icon: Dumbbell,  label: "Gym"        },
  { name: "Droplets",  Icon: Droplets,  label: "Hydration"  },
  { name: "BookOpen",  Icon: BookOpen,  label: "Reading"    },
  { name: "Brain",     Icon: Brain,     label: "Mind"       },
  { name: "Moon",      Icon: Moon,      label: "Sleep"      },
  { name: "Sun",       Icon: Sun,       label: "Morning"    },
  { name: "Zap",       Icon: Zap,       label: "Energy"     },
  { name: "Coffee",    Icon: Coffee,    label: "Coffee"     },
  { name: "Apple",     Icon: Apple,     label: "Nutrition"  },
  { name: "Bike",      Icon: Bike,      label: "Cycling"    },
  { name: "Footprints",Icon: Footprints,label: "Running"    },
  { name: "Leaf",      Icon: Leaf,      label: "Nature"     },
  { name: "Music2",    Icon: Music2,    label: "Music"      },
  { name: "PenLine",   Icon: PenLine,   label: "Journal"    },
  { name: "Code2",     Icon: Code2,     label: "Coding"     },
  { name: "Clock",     Icon: Clock,     label: "Routine"    },
  { name: "Smile",     Icon: Smile,     label: "Mood"       },
  { name: "Star",      Icon: Star,      label: "Goal"       },
];

export function getHabitIcon(name: string): LucideIcon {
  return HABIT_ICONS.find((i) => i.name === name)?.Icon ?? Target;
}
