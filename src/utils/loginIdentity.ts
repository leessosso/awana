const LOGIN_DOMAIN = 'awana.local'

function toBase64Url (input: string): string {
  if (typeof window !== 'undefined') {
    const utf8 = encodeURIComponent(input).replace(
      /%([0-9A-F]{2})/g,
      (_, byte: string) => String.fromCharCode(Number.parseInt(byte, 16))
    )
    return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  return input
}

export function normalizeLoginInput (input: string): string {
  return input.trim().normalize('NFC').toLowerCase()
}

export function toLoginEmail (input: string): string {
  const normalized = normalizeLoginInput(input)
  if (normalized.includes('@')) {
    return normalized
  }

  return `${toBase64Url(normalized)}@${LOGIN_DOMAIN}`
}

export function toLoginIndexKey (input: string): string {
  return toBase64Url(normalizeLoginInput(input))
}

export function getDefaultLoginIdFromEmail (email?: string | null): string | undefined {
  if (!email || !email.endsWith(`@${LOGIN_DOMAIN}`)) {
    return undefined
  }

  return email.replace(`@${LOGIN_DOMAIN}`, '')
}
