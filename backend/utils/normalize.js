const voterId = value => String(value || '').trim().toUpperCase()
const constituency = value => String(value || '').trim().replace(/\s+/g, ' ')
const constituencyKey = value => constituency(value).toLowerCase()
module.exports = { voterId, constituency, constituencyKey }
