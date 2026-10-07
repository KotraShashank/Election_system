const jwt = require('jsonwebtoken')
const { User } = require('../models/userModel/userSchema')
const { asyncHandler, HttpError } = require('../utils/http')
const verifyUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null)
  if (!token) throw new HttpError(401, 'Authentication required')
  let payload
  try { payload = jwt.verify(token, process.env.JWT_SECRET) } catch { throw new HttpError(401, 'Session expired or invalid') }
  const user = await User.findById(payload.userId)
  if (!user) throw new HttpError(401, 'Authentication required')
  req.user = user
  next()
})
module.exports = { verifyUser }
