const { User } = require('./userSchema')
const { Election } = require('../electionModel/electionSchema')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { registration, objectId, text } = require('../../middlewares/validation')
const { voterId, constituency, constituencyKey } = require('../../utils/normalize')
const { HttpError, asyncHandler } = require('../../utils/http')

const publicUser = user => ({
  id: String(user._id),
  firstName: user.firstName,
  lastName: user.lastName,
  voterId: user.voterId,
  gender: user.gender,
  age: user.age,
  phoneNumber: String(user.phoneNumber),
  constituency: user.constituency,
  role: user.role,
  createdAt: user.createdAt
})

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 8 * 60 * 60 * 1000
})

exports.Register = asyncHandler(async (req, res) => {
  const data = registration(req.body || {})

  if (await User.exists({
    voterId: new RegExp(`^${data.voterId}$`, 'i')
  })) {
    throw new HttpError(409, 'Voter ID already exists')
  }

  data.password = await bcrypt.hash(data.password, 12)

  const user = await User.create(data)

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: publicUser(user)
  })
})

exports.Login = asyncHandler(async (req, res) => {
  const body = req.body || {}

  if (
    !/^[A-Z0-9-]{4,30}$/.test(voterId(body.voterId)) ||
    typeof body.password !== 'string' ||
    !body.password
  ) {
    throw new HttpError(422, 'Voter ID and password are required')
  }

  const user = await User.findOne({
    voterId: new RegExp(`^${voterId(body.voterId)}$`, 'i')
  }).select('+password')

  if (!user || !(await bcrypt.compare(body.password, user.password))) {
    throw new HttpError(401, 'Invalid voter ID or password')
  }

  const token = jwt.sign(
    {
      userId: String(user._id),
      voterId: user.voterId,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '8h'
    }
  )

  res
    .cookie('session', token, cookieOptions())
    .json({
      success: true,
      user: publicUser(user)
    })
})

exports.Logout = (req, res) => {
  res.clearCookie('session', {
    ...cookieOptions(),
    maxAge: undefined
  })

  res.json({
    success: true,
    message: 'Signed out'
  })
}

exports.GetUser = (req, res) =>
  res.json({
    success: true,
    user: publicUser(req.user)
  })

exports.GetAllUsers = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    users: (await User.find().sort({ createdAt: -1 })).map(publicUser)
  })
)

exports.UpdateUser = asyncHandler(async (req, res) => {
  objectId(req.params.id)

  const allowed = [
    'firstName',
    'lastName',
    'gender',
    'age',
    'phoneNumber',
    'constituency'
  ]

  if (
    Object.keys(req.body).some(
      k => !allowed.includes(k)
    )
  ) {
    throw new HttpError(422, 'Only safe profile fields can be edited')
  }

  const user = await User.findById(req.params.id)

  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      const value = req.body[key]

      if (
        ['firstName', 'lastName'].includes(key) &&
        !text(value, 1, 60)
      ) {
        throw new HttpError(422, `Invalid ${key}`)
      }

      if (
        key === 'constituency' &&
        !text(value, 2, 100)
      ) {
        throw new HttpError(422, 'Invalid constituency')
      }

      if (
        key === 'gender' &&
        !['male', 'female', 'other', 'prefer not to say'].includes(value)
      ) {
        throw new HttpError(422, 'Invalid gender')
      }

      if (
        key === 'age' &&
        (!Number.isInteger(Number(value)) ||
          +value < 18 ||
          +value > 120)
      ) {
        throw new HttpError(422, 'Invalid age')
      }

      if (
        key === 'phoneNumber' &&
        !/^\+?[0-9]{7,15}$/.test(String(value))
      ) {
        throw new HttpError(422, 'Invalid phone number')
      }

      user[key] =
        key === 'constituency'
          ? constituency(value)
          : ['firstName', 'lastName'].includes(key)
            ? value.trim()
            : value
    }
  }

  await user.save()

  res.json({
    success: true,
    user: publicUser(user)
  })
})

exports.DeleteUser = asyncHandler(async (req, res) => {
  objectId(req.params.id)

  if (String(req.user._id) === req.params.id) {
    throw new HttpError(403, 'You cannot delete your own account')
  }

  const user = await User.findById(req.params.id)

  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  if (user.role === 'admin') {
    throw new HttpError(403, 'Admin accounts cannot be deleted here')
  }

  if (await Election.exists({ 'voters.voterId': user._id })) {
    throw new HttpError(409, 'Cannot delete a user who has voted')
  }

  await user.deleteOne()

  res.json({
    success: true,
    message: 'User deleted'
  })
})

exports.publicUser = publicUser
