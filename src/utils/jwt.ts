export interface DecodedToken {
  exp: number
  iat: number
  [key: string]: unknown
}

export const decodeJWT = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token)
  if (!decoded) return true
  const now = Math.floor(Date.now() / 1000)
  return decoded.exp < now
}

export const isTokenValid = (token: string): boolean => {
  return !!token && !isTokenExpired(token)
}
