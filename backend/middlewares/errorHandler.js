const { HttpError } = require('../utils/http')
module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err)
  if (err.code === 11000) return res.status(409).json({ success: false, message: 'Voter ID already exists' })
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(422).json({ success: false, message: 'Invalid request data' })
  if (!(err instanceof HttpError)) console.error(err)
  res.status(err.status || 500).json({ success: false, message: err.status ? err.message : 'Internal server error' })
}
