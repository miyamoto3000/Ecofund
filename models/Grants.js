// models/Grants.js
import mongoose from 'mongoose';

const GrantSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  eligibility: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  applyLink: {
    type: String,
    required: true, // URL for applying to the grant
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Grant || mongoose.model('Grant', GrantSchema);