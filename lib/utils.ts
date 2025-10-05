export function formatPrice(price: number): string {
  return price.toFixed(2)
}

export function formatCurrency(amount: number): string {
  return `${formatPrice(amount)} PLN`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

export function formatDateTimeShort(dateString: string): string {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)

  const startHours = String(start.getHours()).padStart(2, '0')
  const startMinutes = String(start.getMinutes()).padStart(2, '0')
  const endHours = String(end.getHours()).padStart(2, '0')
  const endMinutes = String(end.getMinutes()).padStart(2, '0')

  return `${startHours}:${startMinutes} - ${endHours}:${endMinutes}`
}

export function formatFieldType(fieldType: string): string {
  const types: { [key: string]: string } = {
    'futsal': 'Futsal',
    'artificial_grass': 'Artificial Grass',
    'natural_grass': 'Natural Grass'
  }
  return types[fieldType] || fieldType
}

export function getFieldTypeIcon(fieldType: string): string {
  const icons: { [key: string]: string } = {
    'futsal': '⚽',
    'artificial_grass': '🌱',
    'natural_grass': '🌿'
  }
  return icons[fieldType] || '⚽'
}