import { createContext, useContext } from 'react'
import type { PlayerSession } from '../engine/synchronization/PlayerSession'

export const PlayerSessionContext = createContext<PlayerSession | null>(null)

export function usePlayerSession(): PlayerSession {
  const s = useContext(PlayerSessionContext)
  if (!s) throw new Error('usePlayerSession must be used inside an experience')
  return s
}
