import client from './client'
export const getAllElections = () => client.get('/elections')
export const getElectionById = id => client.get(`/elections/${id}`)
export const createElection = data => client.post('/elections', data)
export const updateElection = (id, data) => client.put(`/elections/${id}`, data)
export const deleteElection = id => client.delete(`/elections/${id}`)
export const getResults = id => client.get(`/elections/${id}/results`)
export const submitVote = (id, candidateId) => client.post(`/elections/${id}/vote`, { candidateId })
