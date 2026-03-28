import mongoose, { Document, Schema } from 'mongoose';

export interface IScore {
  value: number;
  date: Date;
}

export interface IUserScores extends Document {
  user: mongoose.Types.ObjectId;
  scores: IScore[];
  createdAt: Date;
  updatedAt: Date;
}

const scoreSchema = new Schema<IUserScores>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    scores: [
      {
        value: { type: Number, required: true, min: 1, max: 45 },
        date: { type: Date, required: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

// Keep only last 5 scores, sorted by date desc
scoreSchema.pre('save', function (next) {
  // Sort by date descending
  this.scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // Keep only last 5
  if (this.scores.length > 5) {
    this.scores = this.scores.slice(0, 5);
  }
  next();
});

export const UserScores = mongoose.model<IUserScores>('UserScores', scoreSchema);
