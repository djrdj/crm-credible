export function parseTimestampLabel(label: string) {
  const match = label.trim().match(/^(\d{1,2}):([0-5]\d)$/)

  if (!match) {
    throw new Error('Timestamp must be in MM:SS format.')
  }

  const [, minutes, seconds] = match

  return Number(minutes) * 60 + Number(seconds)
}
