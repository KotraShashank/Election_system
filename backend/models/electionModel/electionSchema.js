const mongoose = require('mongoose')
const { constituency, constituencyKey } = require('../../utils/normalize')
const candidateSchema = new mongoose.Schema({ candidateName: { type: String, required: true, trim: true }, party: { type: String, required: true, trim: true }, votes: { type: Number, default: 0, min: 0 } })
const electionSchema = new mongoose.Schema({
  constituency: { type: String, required: true, set: constituency },
  constituencyKey: { type: String, index: true },
  startAt: Date, endAt: Date,
  electionStartDate: Date, electionStartTime: String, electionEndDate: Date, electionEndTime: String,
  candidates: [candidateSchema],
  voters: [{ voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } }]
}, { timestamps: true })
electionSchema.pre('validate', function(next) { this.constituencyKey = constituencyKey(this.constituency); next() })
module.exports.Election = mongoose.model('Election', electionSchema)
