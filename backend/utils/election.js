const { HttpError } = require('./http')
// Legacy date fields store a calendar day and separate wall-clock time. Offset is explicit.
function legacyDate(date, time) {
  if (!date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) return null
  const day = new Date(date).toISOString().slice(0, 10)
  const offset = process.env.LEGACY_TIME_OFFSET || '+05:30'
  if (!/^[+-](0\d|1[0-4]):[0-5]\d$/.test(offset)) throw new Error('Invalid LEGACY_TIME_OFFSET')
  return new Date(`${day}T${time}:00${offset}`)
}
function windowOf(election) {
  const startAt = election.startAt || legacyDate(election.electionStartDate, election.electionStartTime)
  const endAt = election.endAt || legacyDate(election.electionEndDate, election.electionEndTime)
  if (!startAt || !endAt || Number.isNaN(+startAt) || Number.isNaN(+endAt)) throw new HttpError(422, 'Election has an invalid voting window')
  return { startAt: new Date(startAt), endAt: new Date(endAt) }
}
function statusOf(election, now = new Date()) {
  const { startAt, endAt } = windowOf(election)
  return now < startAt ? 'upcoming' : now >= endAt ? 'ended' : 'active'
}
function resultsOf(election) {
  const candidates = election.candidates.map(c => ({ id: String(c._id), candidateName: c.candidateName, party: c.party, votes: c.votes }))
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0)
  const highest = Math.max(...candidates.map(c => c.votes))
  const leaders = candidates.filter(c => c.votes === highest)
  return { candidates, totalVotes, winner: leaders.length === 1 && totalVotes > 0 ? leaders[0] : null, tie: leaders.length > 1 && totalVotes > 0 }
}
function serializeElection(election, user) {
  const { startAt, endAt } = windowOf(election)
  const status = statusOf(election)
  const admin = user.role === 'admin'
  const resultVisible = admin || status === 'ended'
  return {
    id: String(election._id), constituency: election.constituency, startAt, endAt, status,
    candidates: election.candidates.map(c => ({ id: String(c._id), candidateName: c.candidateName, party: c.party, ...(resultVisible ? { votes: c.votes } : {}) })),
    hasVoted: !admin && election.voters.some(v => String(v.voterId) === String(user._id)),
    ...(resultVisible ? { results: resultsOf(election) } : {}),
    createdAt: election.createdAt
  }
}
module.exports = { windowOf, statusOf, resultsOf, serializeElection }
