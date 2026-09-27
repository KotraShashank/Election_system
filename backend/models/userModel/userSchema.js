const mongoose = require('mongoose')
const { voterId, constituency, constituencyKey } = require('../../utils/normalize')
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  voterId: { type: String, required: true, unique: true, index: true, set: voterId },
  gender: { type: String, required: true, enum: ['male','female','other','prefer not to say'] },
  age: { type: Number, required: true, min: 18, max: 120 },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true, select: false },
  constituency: { type: String, required: true, set: constituency },
  constituencyKey: { type: String, index: true },
  role: { type: String, enum: ['admin','voter'], default: 'voter' }
}, { timestamps: true })
userSchema.pre('validate', function(next) { this.constituencyKey = constituencyKey(this.constituency); next() })
module.exports.User = mongoose.model('User', userSchema)
