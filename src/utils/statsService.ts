import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import type { ParsedBoxScore, PlayerGameStats } from '../types'

export async function savePlayerStats(data: ParsedBoxScore, file: File): Promise<PlayerGameStats> {
  const storageRef = ref(storage, `screenshots/${data.username}-${Date.now()}`)
  await uploadBytes(storageRef, file)
  const screenshotUrl = await getDownloadURL(storageRef)

  const docRef = await addDoc(collection(db, 'stats'), { ...data, screenshotUrl })
  return { id: docRef.id, ...data, screenshotUrl }
}

export async function fetchPlayerStats(username: string): Promise<PlayerGameStats[]> {
  const q = query(collection(db, 'stats'), where('username', '==', username))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as PlayerGameStats) }))
}
