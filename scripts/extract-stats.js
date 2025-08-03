import sharp from 'sharp'
import Tesseract from 'tesseract.js'
import { addDoc, collection } from 'firebase/firestore'
import { db } from './firebase.js'

async function extractStats(imagePath, username, crop) {
  let img = sharp(imagePath).grayscale()
  if (crop) {
    img = img.extract(crop)
  }
  const processed = await img.toBuffer()
  const { data: { text } } = await Tesseract.recognize(processed, 'eng')
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const target = lines.find(l => l.toUpperCase().includes(username.toUpperCase()))
  if (!target) throw new Error('Username not found')
  const parts = target.split('|').map(p => p.trim())
  if (parts.length < 12) throw new Error('Incomplete stats row')
  const [name, grade, pts, reb, ast, stl, blk, fouls, to, fgmFga, tpmTpa, ftmFta] = parts
  const [fgm, fga] = fgmFga.split('/').map(Number)
  const [threePm, threePa] = tpmTpa.split('/').map(Number)
  const [ftm, fta] = ftmFta.split('/').map(Number)
  const stats = {
    username: name,
    date: new Date().toISOString().slice(0, 10),
    grade,
    points: Number(pts),
    rebounds: Number(reb),
    assists: Number(ast),
    steals: Number(stl),
    blocks: Number(blk),
    fouls: Number(fouls),
    turnovers: Number(to),
    fgm,
    fga,
    three_pm: threePm,
    three_pa: threePa,
    ftm,
    fta,
  }
  let uploadSuccess = false
  try {
    await addDoc(collection(db, 'boxscores'), stats)
    uploadSuccess = true
  } catch (err) {
    console.error('Upload failed:', err)
  }
  return { stats, uploadSuccess }
}

export default extractStats

if (import.meta.url === `file://${process.argv[1]}`) {
  const [imagePath, username = 'AUSWEN'] = process.argv.slice(2)
  extractStats(imagePath, username).then(res => {
    console.log(JSON.stringify(res, null, 2))
  }).catch(err => {
    console.error(err)
  })
}
