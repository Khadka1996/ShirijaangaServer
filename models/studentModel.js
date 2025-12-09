const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    validate: {
      validator: function(v) {
        return /^\+977\d{10}$/.test(v);
      },
      message: 'Mobile number must be in format +977XXXXXXXXXX'
    }
  },
  office: {
    type: String,
    required: [true, 'Office location is required'],
    enum: ['Kathmandu', 'Pokhara']
  },
  topics: {
    type: String,
    required: [true, 'Consultation topics are required']
  },
  destinations: {
    type: String,
    required: [true, 'Destination countries are required']
  },
  otherDestination: {
    type: String,
    default: ''
  },
  slc: {
    type: String,
    required: [true, 'SLC results are required'],
    default: 'N/A'
  },
  plusTwo: {
    type: String,
    required: [true, '+2 results are required'],
    default: 'N/A'
  },
  bachelor: {
    type: String,
    default: 'N/A'
  },
  healthIssues: {
    type: String,
    default: 'None'
  },
  additionalInfo: {
    type: String,
    default: 'None'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

studentSchema.index({ email: 1, mobile: 1 });

module.exports = mongoose.model('Student', studentSchema);