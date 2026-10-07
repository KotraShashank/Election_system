const { randomUUID } = require('crypto')
const { User } = require('../models/userModel/userSchema')

const CLAIM_DURATION_SECONDS = 300

async function claimUserOperation(userId, type) {
  const token = randomUUID()
  const user = await User.findOneAndUpdate({
    _id: userId,
    $or: [
      { 'operationClaim.expiresAt': { $exists: false } },
      { $expr: { $lte: ['$operationClaim.expiresAt', '$$NOW'] } }
    ]
  }, [{
    $set: {
      operationClaim: {
        token: { $literal: token },
        type: { $literal: type },
        expiresAt: { $dateAdd: { startDate: '$$NOW', unit: 'second', amount: CLAIM_DURATION_SECONDS } }
      }
    }
  }], { new: true })

  return user ? token : null
}

function activeClaimFilter(userId, token, type) {
  return {
    _id: userId,
    'operationClaim.token': token,
    'operationClaim.type': type,
    $expr: { $gt: ['$operationClaim.expiresAt', '$$NOW'] }
  }
}

async function releaseUserOperation(userId, token) {
  await User.updateOne({ _id: userId, 'operationClaim.token': token }, { $unset: { operationClaim: 1 } })
}

module.exports = { claimUserOperation, activeClaimFilter, releaseUserOperation }
