const { Election } = require('./electionSchema')
const { electionInput, objectId } = require('../../middlewares/validation')
const { constituencyKey } = require('../../utils/normalize')
const { statusOf, serializeElection, resultsOf, windowOf } = require('../../utils/election')
const { HttpError, asyncHandler } = require('../../utils/http')
async function findElection(id) { objectId(id); const election = await Election.findById(id); if (!election) throw new HttpError(404, 'Election not found'); return election }
function canAccess(election, user) {
  if (user.role !== 'admin' && constituencyKey(election.constituency) !== constituencyKey(user.constituency)) throw new HttpError(403, 'Election is outside your constituency')
}
exports.GetAllElections = asyncHandler(async (req, res) => {
  const query = req.user.role === 'admin' ? {} : { $or: [{ constituencyKey: constituencyKey(req.user.constituency) }, { constituency: new RegExp(`^${req.user.constituency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }] }
  const elections = await Election.find(query).sort({ startAt: -1, electionStartDate: -1 })
  res.json({ success: true, elections: elections.map(e => serializeElection(e, req.user)) })
})
exports.GetElectionById = asyncHandler(async (req, res) => { const election = await findElection(req.params.id); canAccess(election, req.user); res.json({ success: true, election: serializeElection(election, req.user) }) })
exports.CreateElection = asyncHandler(async (req, res) => {
  const data = electionInput(req.body)
  if (data.startAt <= new Date()) throw new HttpError(422, 'Election must start in the future')
  const election = await Election.create(data)
  res.status(201).json({ success: true, election: serializeElection(election, req.user) })
})
exports.UpdateElection = asyncHandler(async (req, res) => {
  const election = await findElection(req.params.id)
  if (statusOf(election) !== 'upcoming' || election.voters.length) throw new HttpError(409, 'Only upcoming elections without votes can be edited')
  const data = electionInput(req.body)
  if (data.startAt <= new Date()) throw new HttpError(422, 'Election must start in the future')
  election.set({ ...data, electionStartDate: undefined, electionStartTime: undefined, electionEndDate: undefined, electionEndTime: undefined })
  await election.save()
  res.json({ success: true, election: serializeElection(election, req.user) })
})
exports.DeleteElection = asyncHandler(async (req, res) => {
  const election = await findElection(req.params.id)
  if (statusOf(election) !== 'upcoming' || election.voters.length) throw new HttpError(409, 'Only upcoming elections without votes can be deleted')
  await election.deleteOne()
  res.json({ success: true, message: 'Election deleted' })
})
exports.GetResults = asyncHandler(async (req, res) => {
  const election = await findElection(req.params.id)
  canAccess(election, req.user)
  if (req.user.role !== 'admin' && statusOf(election) !== 'ended') throw new HttpError(403, 'Results are available after the election ends')
  res.json({ success: true, results: resultsOf(election) })
})
exports.SubmitVote = asyncHandler(async (req, res) => {
  const electionId = req.params.id
  const { candidateId } = req.body || {}
  objectId(electionId); objectId(candidateId)
  const election = await findElection(electionId)
  canAccess(election, req.user)
  if (statusOf(election) !== 'active') throw new HttpError(409, 'Election is not open for voting')
  if (!election.candidates.some(c => String(c._id) === candidateId)) throw new HttpError(404, 'Candidate not found in this election')
  if (election.voters.some(v => String(v.voterId) === String(req.user._id))) throw new HttpError(409, 'You have already voted')
  const now = new Date()
  const { startAt, endAt } = windowOf(election)
  // Add normalized timestamps to legacy records before the conditional vote.
  if (!election.startAt || !election.endAt) {
    await Election.updateOne({ _id: election._id, startAt: { $exists: false } }, { $set: { startAt, endAt } })
  }
  const updated = await Election.updateOne({
    _id: election._id, constituency: election.constituency,
    'candidates._id': candidateId,
    voters: { $not: { $elemMatch: { voterId: req.user._id } } },
    startAt: { $lte: now }, endAt: { $gt: now }
  }, { $inc: { 'candidates.$.votes': 1 }, $push: { voters: { voterId: req.user._id } } })
  if (!updated.modifiedCount) throw new HttpError(409, 'Vote could not be recorded; refresh the election and try again')
  res.json({ success: true, message: 'Vote recorded', votedAt: now, electionEndsAt: endAt, electionStartedAt: startAt })
})
