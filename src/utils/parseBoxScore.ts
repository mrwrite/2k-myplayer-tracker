import Tesseract from 'tesseract.js'
import type { BoxScoreStats } from '../types'

export async function parseBoxScore(image: File | string): Promise<BoxScoreStats> {
  const {
    data: { text }
  } = await Tesseract.recognize(image, 'eng')

  const pointsMatch = text.match(/PTS\s+(\d+)/i)
  const reboundsMatch = text.match(/REB\s+(\d+)/i)
  const assistsMatch = text.match(/AST\s+(\d+)/i)

  return {
    points: pointsMatch ? parseInt(pointsMatch[1], 10) : 0,
    rebounds: reboundsMatch ? parseInt(reboundsMatch[1], 10) : 0,
    assists: assistsMatch ? parseInt(assistsMatch[1], 10) : 0
  }
}
