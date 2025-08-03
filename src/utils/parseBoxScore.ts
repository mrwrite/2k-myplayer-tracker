import Tesseract from 'tesseract.js'
import type { ParsedBoxScore } from '../types'

type OCRWord = {
  text: string
  bbox: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

export async function parseBoxScore(image: File | string, username: string): Promise<ParsedBoxScore | { error: string }> {
  const result = await Tesseract.recognize(image, 'eng')

  // Force-cast to access .words, which exists even if not in default types
  const words = (result.data as any).words as OCRWord[]

  if (!words || words.length === 0) {
    return { error: 'OCR did not detect any words.' }
  }

  const targetWord = words.find(w =>
    w.text.toUpperCase().includes(username.toUpperCase())
  )

  if (!targetWord) {
    return { error: `Username "${username}" not found in image.` }
  }

  const targetY = targetWord.bbox.y0

  const sameLineWords = words.filter(w =>
    Math.abs(w.bbox.y0 - targetY) <= 10
  )

  const row = sameLineWords.map(w => w.text).join(' ')
  console.log('Extracted Row:', row)

  const lineRegex = new RegExp(
    `${username}\\s+(\\w)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)/(\\d+)\\s+(\\d+)/(\\d+)\\s+(\\d+)/(\\d+)`,
    'i'
  )

  const match = row.match(lineRegex)

  if (!match) {
    return { error: 'Could not parse stat line from detected row.' }
  }

  return {
    username,
    grade: match[1],
    points: parseInt(match[2]),
    rebounds: parseInt(match[3]),
    assists: parseInt(match[4]),
    steals: parseInt(match[5]),
    blocks: parseInt(match[6]),
    fouls: parseInt(match[7]),
    turnovers: parseInt(match[8]),
    fgm: parseInt(match[9]),
    fga: parseInt(match[10]),
    tpm: parseInt(match[11]),
    tpa: parseInt(match[12]),
    ftm: parseInt(match[13]),
    fta: parseInt(match[14]),
    date: new Date().toISOString().split('T')[0]
  }
}