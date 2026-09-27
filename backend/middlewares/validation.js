const { HttpError } = require('../utils/http')
const { voterId, constituency } = require('../utils/normalize')
const mongoose = require('mongoose')
const text = (value, min = 1, max = 100) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max
function registration(body) {
  if (!text(body.firstName, 1, 60) || !text(body.lastName, 1, 60) || !/^[A-Z0-9-]{4,30}$/.test(voterId(body.voterId)) || !['male','female','other','prefer not to say'].includes(body.gender) || !Number.isInteger(Number(body.age)) || Number(body.age) < 18 || Number(body.age) > 120 || !/^\+?[0-9]{7,15}$/.test(String(body.phoneNumber || '')) || !text(body.constituency, 2, 100) || !/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(body.password || '')) throw new HttpError(422, 'Check all registration fields. Password needs 8 characters, a letter and a number.')
  return { firstName: body.firstName.trim(), lastName: body.lastName.trim(), voterId: voterId(body.voterId), gender: body.gender, age: Number(body.age), phoneNumber: String(body.phoneNumber), constituency: constituency(body.constituency), password: body.password, role: 'voter' }
}
function electionInput(body) {
  body = body || {}
  if (!text(body.constituency, 2, 100) || !Array.isArray(body.candidates) || body.candidates.length < 2 || body.candidates.length > 30) throw new HttpError(422, 'Provide a constituency and 2 to 30 candidates')
  const startAt = new Date(body.startAt), endAt = new Date(body.endAt)
  if (!body.startAt || !body.endAt || Number.isNaN(+startAt) || Number.isNaN(+endAt) || startAt >= endAt) throw new HttpError(422, 'Provide a valid start and end time')
  const candidates = body.candidates.map(c => {
    if (!c || !text(c.candidateName, 1, 100) || !text(c.party, 1, 100)) throw new HttpError(422, 'Candidate name and party are required')
    return { candidateName: c.candidateName.trim(), party: c.party.trim(), votes: 0 }
  })
  if (new Set(candidates.map(c => c.candidateName.toLowerCase())).size !== candidates.length) throw new HttpError(422, 'Candidate names must be unique in an election')
  return { constituency: constituency(body.constituency), startAt, endAt, candidates }
}
function objectId(id) { if (!mongoose.isValidObjectId(id)) throw new HttpError(422, 'Invalid ID') }
module.exports = { registration, electionInput, objectId, text }
