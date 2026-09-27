import { useCallback, useEffect, useState } from 'react'
import { getAllElections } from '../api/electionApi'
import { messageOf } from '../api/client'
export function useElections() {
  const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const reload = useCallback(async () => {
    setLoading(true); setError('')
    try { setItems((await getAllElections()).data.elections) } catch (e) { setError(messageOf(e)) } finally { setLoading(false) }
  }, [])
  useEffect(() => { reload() }, [reload])
  return { items, loading, error, reload }
}
