const request = require('supertest')
jest.setTimeout(120000)
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
process.env.JWT_SECRET = 'test-secret-of-at-least-thirty-two-characters'
process.env.FRONTEND_URL = 'http://localhost:5173'
const { app } = require('../app')
const { User } = require('../models/userModel/userSchema')
const { Election } = require('../models/electionModel/electionSchema')
let mongo, voter, other, admin, election
const sample = (voterId, constituency = 'Raipur') => ({ firstName: 'Test', lastName: 'Voter', voterId, gender: 'other', age: 25, phoneNumber: '0123456789', password: 'Password123', constituency })
const signIn = async id => { const res = await request(app).post('/v1/login').send({ voterId: id, password: 'Password123' }); if (res.status !== 200) throw new Error(`${id}: ${JSON.stringify(res.body)}`); return res.headers['set-cookie'] }
const candidateData = [{ candidateName: 'Alice', party: 'A' }, { candidateName: 'Bob', party: 'B' }]
const create = async (start, end, constituency = 'Raipur') => Election.create({ constituency, startAt: start, endAt: end, candidates: candidateData })
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()) })
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop() })
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Election.deleteMany({})])
  const first = await request(app).post('/v1/register').send({ ...sample('VOTER001'), role: 'admin' }); if (first.status !== 201) throw new Error(JSON.stringify(first.body))
  await request(app).post('/v1/register').send(sample('OTHER001', 'Bilaspur'))
  admin = await User.create({ ...sample('ADMIN001'), password: await bcrypt.hash('Password123', 12), role: 'admin' })
  voter = await signIn('VOTER001'); other = await signIn('OTHER001'); admin = await signIn('ADMIN001')
  election = await create(new Date(Date.now() - 60000), new Date(Date.now() + 600000))
})
test('registration forces voter role, hashes password, normalizes voter ID and omits password', async () => {
  const res = await request(app).post('/v1/register').send({ ...sample(' mixed007 '), role: 'admin' })
  expect(res.status).toBe(201); expect(res.body.user.role).toBe('voter'); expect(res.body.user.password).toBeUndefined()
  const stored = await User.findOne({ voterId: 'MIXED007' }).select('+password')
  expect(await bcrypt.compare('Password123', stored.password)).toBe(true)
})
test('duplicate voter ID fails', async () => { expect((await request(app).post('/v1/register').send(sample('voter001'))).status).toBe(409) })
test('valid login succeeds and never returns password', async () => { const res = await request(app).post('/v1/login').send({ voterId: 'voter001', password: 'Password123' }); expect(res.status).toBe(200); expect(res.body.user.password).toBeUndefined(); expect(res.headers['set-cookie']).toBeDefined() })
test('invalid password and unknown user fail', async () => { for (const voterId of ['VOTER001','UNKNOWN1']) expect((await request(app).post('/v1/login').send({ voterId, password: 'wrong' })).status).toBe(401) })
test('unauthenticated and voter requests cannot access admin users', async () => { expect((await request(app).get('/v1/users')).status).toBe(401); expect((await request(app).get('/v1/users').set('Cookie', voter)).status).toBe(403) })
test('admin can access users without passwords', async () => { const res = await request(app).get('/v1/users').set('Cookie', admin); expect(res.status).toBe(200); expect(res.body.users.length).toBe(3); expect(JSON.stringify(res.body)).not.toContain('password') })
test('voter cannot create; admin can create valid election', async () => { const data = { constituency: 'Raipur', startAt: new Date(Date.now() + 60000), endAt: new Date(Date.now() + 600000), candidates: candidateData.map(c => ({ ...c, votes: 100 })) }; expect((await request(app).post('/v1/elections').set('Cookie', voter).send(data)).status).toBe(403); const res = await request(app).post('/v1/elections').set('Cookie', admin).send(data); expect(res.status).toBe(201); expect(res.body.election.candidates[0].votes).toBe(0) })
test('voter sees only matching constituency and no live counts or participation IDs', async () => { await create(new Date(Date.now() - 1000), new Date(Date.now() + 60000), 'Bilaspur'); const res = await request(app).get('/v1/elections').set('Cookie', voter); expect(res.body.elections).toHaveLength(1); expect(res.body.elections[0].candidates[0].votes).toBeUndefined(); expect(JSON.stringify(res.body)).not.toContain('voters') })
test('valid vote increments once and repeat vote conflicts', async () => { const id = String(election._id), candidateId = String(election.candidates[0]._id); const res = await request(app).post(`/v1/elections/${id}/vote`).set('Cookie', voter).send({ candidateId }); expect(res.status).toBe(200); expect((await request(app).post(`/v1/elections/${id}/vote`).set('Cookie', voter).send({ candidateId })).status).toBe(409); const stored = await Election.findById(id); expect(stored.candidates[0].votes).toBe(1); expect(stored.voters).toHaveLength(1) })
test('parallel duplicate vote requests yield one success', async () => { const path = `/v1/elections/${election._id}/vote`, candidateId = String(election.candidates[0]._id); const responses = await Promise.all([request(app).post(path).set('Cookie', voter).send({ candidateId }), request(app).post(path).set('Cookie', voter).send({ candidateId })]); expect(responses.map(r => r.status).sort()).toEqual([200,409]); const stored = await Election.findById(election._id); expect(stored.candidates[0].votes).toBe(1); expect(stored.voters).toHaveLength(1) })
test('invalid candidate does not record participation', async () => { const res = await request(app).post(`/v1/elections/${election._id}/vote`).set('Cookie', voter).send({ candidateId: new mongoose.Types.ObjectId() }); expect(res.status).toBe(404); expect((await Election.findById(election._id)).voters).toHaveLength(0) })
test('upcoming and ended elections reject votes', async () => { for (const [start,end] of [[60000,120000],[-120000,-60000]]) { const e = await create(new Date(Date.now()+start), new Date(Date.now()+end)); expect((await request(app).post(`/v1/elections/${e._id}/vote`).set('Cookie', voter).send({ candidateId: String(e.candidates[0]._id) })).status).toBe(409) } })
test('wrong constituency cannot view or vote', async () => { expect((await request(app).get(`/v1/elections/${election._id}`).set('Cookie', other)).status).toBe(403); expect((await request(app).post(`/v1/elections/${election._id}/vote`).set('Cookie', other).send({ candidateId: String(election.candidates[0]._id) })).status).toBe(403) })
test('profile update rejects role and password mutation', async () => { const id = (await User.findOne({ voterId: 'VOTER001' }))._id; expect((await request(app).put(`/v1/users/${id}`).set('Cookie', admin).send({ role: 'admin' })).status).toBe(422); expect((await request(app).put(`/v1/users/${id}`).set('Cookie', voter).send({ firstName: 'Hacker' })).status).toBe(403) })
test('active election cannot be edited or deleted', async () => { const data = { constituency: 'Raipur', startAt: new Date(Date.now()+60000), endAt: new Date(Date.now()+120000), candidates: candidateData }; expect((await request(app).put(`/v1/elections/${election._id}`).set('Cookie', admin).send(data)).status).toBe(409); expect((await request(app).delete(`/v1/elections/${election._id}`).set('Cookie', admin)).status).toBe(409) })
test('legacy separate date and time fields vote using offset and backfill UTC window', async () => {
  const previous = process.env.LEGACY_TIME_OFFSET
  process.env.LEGACY_TIME_OFFSET = '+00:00'
  try {
    const start = new Date(Date.now() - 120000), end = new Date(Date.now() + 120000)
    const legacy = await Election.create({ constituency: 'Raipur', electionStartDate: start.toISOString().slice(0,10), electionStartTime: start.toISOString().slice(11,16), electionEndDate: end.toISOString().slice(0,10), electionEndTime: end.toISOString().slice(11,16), candidates: candidateData })
    const res = await request(app).post(`/v1/elections/${legacy._id}/vote`).set('Cookie', voter).send({ candidateId: String(legacy.candidates[0]._id) })
    expect(res.status).toBe(200)
    const stored = await Election.findById(legacy._id)
    expect(stored.startAt).toBeInstanceOf(Date)
    expect(stored.candidates[0].votes).toBe(1)
  } finally { if (previous === undefined) delete process.env.LEGACY_TIME_OFFSET; else process.env.LEGACY_TIME_OFFSET = previous }
})
test('malformed candidate and missing login body return validation errors', async () => {
  const data = { constituency: 'Raipur', startAt: new Date(Date.now()+60000), endAt: new Date(Date.now()+120000), candidates: [null, candidateData[1]] }
  expect((await request(app).post('/v1/elections').set('Cookie', admin).send(data)).status).toBe(422)
  expect((await request(app).post('/v1/login').send({})).status).toBe(422)
})
test('admin edits and deletes an upcoming election', async () => {
  const upcoming = await create(new Date(Date.now()+120000), new Date(Date.now()+240000))
  const update = { constituency: 'Bilaspur', startAt: new Date(Date.now()+180000), endAt: new Date(Date.now()+300000), candidates: [{ candidateName: 'Carol', party: 'C' }, { candidateName: 'Dan', party: 'D' }] }
  const edited = await request(app).put(`/v1/elections/${upcoming._id}`).set('Cookie', admin).send(update)
  expect(edited.status).toBe(200)
  expect(edited.body.election.constituency).toBe('Bilaspur')
  expect((await request(app).delete(`/v1/elections/${upcoming._id}`).set('Cookie', admin)).status).toBe(200)
  expect(await Election.findById(upcoming._id)).toBeNull()
})
test('ended voter results report a tie without participant IDs', async () => {
  const ended = await create(new Date(Date.now()-240000), new Date(Date.now()-120000))
  ended.candidates[0].votes = 2; ended.candidates[1].votes = 2; await ended.save()
  const res = await request(app).get(`/v1/elections/${ended._id}/results`).set('Cookie', voter)
  expect(res.status).toBe(200)
  expect(res.body.results.tie).toBe(true)
  expect(res.body.results.winner).toBeNull()
  expect(JSON.stringify(res.body)).not.toContain('voterId')
  expect((await request(app).get(`/v1/elections/${election._id}/results`).set('Cookie', voter)).status).toBe(403)
})
test('admin updates safe user fields and deletes a voter who has not voted', async () => {
  const target = await User.findOne({ voterId: 'OTHER001' })
  const updated = await request(app).put(`/v1/users/${target._id}`).set('Cookie', admin).send({ firstName: 'Changed', phoneNumber: '0012345678' })
  expect(updated.status).toBe(200)
  expect(updated.body.user.phoneNumber).toBe('0012345678')
  expect(updated.body.user.password).toBeUndefined()
  expect((await request(app).delete(`/v1/users/${target._id}`).set('Cookie', admin)).status).toBe(200)
  expect(await User.findById(target._id)).toBeNull()
})
