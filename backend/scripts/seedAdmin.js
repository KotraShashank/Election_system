require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { User } = require('../models/userModel/userSchema')
const { voterId } = require('../utils/normalize')
const { registration } = require('../middlewares/validation')
async function main() {
  const { ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_VOTER_ID, ADMIN_PASSWORD, ADMIN_CONSTITUENCY, ADMIN_AGE, ADMIN_PHONE_NUMBER, ADMIN_GENDER } = process.env
  const data = registration({ firstName: ADMIN_FIRST_NAME, lastName: ADMIN_LAST_NAME, voterId: ADMIN_VOTER_ID, password: ADMIN_PASSWORD, constituency: ADMIN_CONSTITUENCY, age: ADMIN_AGE, phoneNumber: ADMIN_PHONE_NUMBER, gender: ADMIN_GENDER })
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGOURL)
  if (await User.exists({ voterId: new RegExp(`^${voterId(ADMIN_VOTER_ID)}$`, 'i') })) { console.log('Voter ID already exists; no changes made'); return }
  await User.create({ ...data, password: await bcrypt.hash(data.password, 12), role: 'admin' })
  console.log('Admin created')
}
main().catch(e => { console.error(e.message); process.exitCode = 1 }).finally(() => mongoose.disconnect())
