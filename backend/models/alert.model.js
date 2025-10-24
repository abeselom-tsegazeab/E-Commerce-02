import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'notified', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  notifiedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate alerts
alertSchema.index({ user: 1, product: 1 }, { unique: true });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
