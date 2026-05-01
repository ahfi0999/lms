import dayjs from 'dayjs';

export function formatDateWithTime(date: Date | string) {
  return dayjs(date).format('MMMM DD, YYYY h:mm A');
}

export function formatDate(date: Date | string) {
  return dayjs(date).format('MMMM DD, YYYY');
}
