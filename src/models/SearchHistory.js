import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tmdbId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  searchType: {
    type: String,
    enum: ['movie', 'tv', 'person'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index for unique searches per user
searchHistorySchema.index({ userId: 1, tmdbId: 1, searchType: 1 }, { unique: true });

export const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);