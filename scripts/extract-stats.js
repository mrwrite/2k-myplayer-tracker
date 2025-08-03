import sharp from 'sharp'
import Tesseract from 'tesseract.js'
import { addDoc, collection } from 'firebase/firestore'
import { db } from './firebase.js'

async function extractStats(imagePath, username, crop) {
  // Preprocess: grayscale, normalize contrast, optionally crop and upscale
  let img = sharp(imagePath).grayscale().normalise()
  if (crop) {
    img = img.extract(crop)
  }
  const metadata = await img.metadata()
  img = img.resize({ width: Math.round(metadata.width * 2) })
  const processed = await img.toBuffer()

  // Run OCR and grab line level text
  const { data } = await Tesseract.recognize(processed, 'eng')

  // Locate the username by line text instead of bounding boxes
  const line = data.lines.find(l =>
    l.text.toUpperCase().includes(username.toUpperCase()),
  )
  if (!line) throw new Error('Username not found')
  let parts = line.text.trim().split(/\s+/)

  // Fix cases where fractions like 9/16 are split into ['9', '/', '16']
  const normalized = []
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i + 1] === '/' && parts[i + 2]) {
      normalized.push(`${parts[i]}/${parts[i + 2]}`)
      i += 2
    } else {
      normalized.push(parts[i])
    }
  }
  parts = normalized

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
