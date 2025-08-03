import type { ParsedBoxScore } from '../types'

/**
 * Sends a box score image to the backend OCR API and returns parsed stats.
 */
export async function parseBoxScore(
  file: File,
  username: string
): Promise<ParsedBoxScore | { error: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('username', username)

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  try {
    const response = await fetch(`${baseUrl}/parse-boxscore`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      return { error: (data && data.detail) || 'Failed to parse box score.' }
    }

    return (await response.json()) as ParsedBoxScore
  } catch (err) {
    console.error('parseBoxScore error', err)
    return {
      error: `Unable to reach OCR server at ${baseUrl}. Ensure the backend is running.`,
    }
  }
}

