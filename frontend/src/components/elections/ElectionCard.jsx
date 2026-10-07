import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/date'
export function ElectionStatus({ election }) { return <span className={`badge badge-${election.status}`}>{election.status}</span> }
export function ElectionCard({ election, to }) {
  return <Link className="election-card" to={to || `/elections/${election.id}`}>
    <div className="election-card-head"><div><div className="election-constituency">{election.constituency}</div><div className="election-dates">{formatDate(election.startAt)} – {formatDate(election.endAt)}</div></div><ElectionStatus election={election} /></div>
    <div className="candidate-count">{election.candidates.length} candidates{typeof election.hasVoted === 'boolean' ? ` · ${election.hasVoted ? 'Voted' : 'Not voted'}` : ''}</div>
  </Link>
}
