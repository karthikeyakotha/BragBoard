import { format, isToday, isYesterday } from 'date-fns';

export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return format(date, 'p'); // e.g., 12:00 PM
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'p')}`; // e.g., Yesterday at 12:00 PM
  }

  return format(date, 'Pp'); // e.g., 07/06/2024, 12:00 PM
};
