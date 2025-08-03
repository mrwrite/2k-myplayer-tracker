import Tesseract from 'tesseract.js'
import type { ParsedBoxScore } from '../types'

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function parseBoxScore(image: File | string, username: string): Promise<ParsedBoxScore> {
  const { data: { text } } = await Tesseract.recognize(image, 'eng')

  const lineRegex = new RegExp(
    `${escapeRegExp(username)}\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)-(\\d+)\\s+(\\d+)-(\\d+)\\s+(\\d+)-(\\d+)\\s+([^\\s]+)`,
    'i'
  )

  const match = text.match(lineRegex)
  const dateMatch = text.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/)

  return {
    username,
    points: match ? parseInt(match[1], 10) : 0,
    rebounds: match ? parseInt(match[2], 10) : 0,
    assists: match ? parseInt(match[3], 10) : 0,
    steals: match ? parseInt(match[4], 10) : 0,
    blocks: match ? parseInt(match[5], 10) : 0,
    fgm: match ? parseInt(match[6], 10) : 0,
    fga: match ? parseInt(match[7], 10) : 0,
    tpm: match ? parseInt(match[8], 10) : 0,
    tpa: match ? parseInt(match[9], 10) : 0,
    ftm: match ? parseInt(match[10], 10) : 0,
    fta: match ? parseInt(match[11], 10) : 0,
    grade: match ? match[12] : '',
    date: dateMatch ? dateMatch[0] : '',
  }
}
