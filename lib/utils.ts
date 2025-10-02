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
    minute: '2-digit'
  })
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTimeShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}