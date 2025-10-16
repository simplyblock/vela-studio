import dayjs from 'dayjs'

export const formatBackupDate = (value: string | null) => {
  if (!value) return 'Not scheduled'
  return dayjs(value).format('MMM D, YYYY HH:mm')
}
