const Mongoose = require('mongoose')

const intentSchema = new Mongoose.Schema({
  _id: { type: String },
  type: { type: String },
  projects: [{ type: String, ref: 'Project' }],
  title: { type: String },
  description: { type: String },
  status: { type: String, default: 'active' },
  direction: { type: String }, // offer || request
  collaborationType: { type: String },
  condition: { type: String }
})

const Intent = Mongoose.model('Intent', intentSchema, 'intents')

module.exports = Intent
