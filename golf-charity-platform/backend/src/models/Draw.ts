import mongoose, { Document, Schema } from 'mongoose';

export interface IWinner {
  user: mongoose.Types.ObjectId;
  matchType: '5-match' | '4-match' | '3-match';
  prizeAmount: number;
  paymentStatus: 'pending' | 'paid' | 'rejected';
  proofUrl: string;
  verificationStatus: 'unsubmitted' | 'pending' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
}

export interface IDraw extends Document {
  month: number;
  year: number;
  drawnNumbers: number[];
  drawType: 'random' | 'algorithmic';
  status: 'simulation' | 'published';
  prizePool: {
    total: number;
    jackpot: number;   // 40%
    fourMatch: number; // 35%
    threeMatch: number;// 25%
    jackpotRolledOver: number;
  };
  winners: IWinner[];
  participantCount: number;
  jackpotRolledFromPrevious: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const drawSchema = new Schema<IDraw>(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    drawnNumbers: [{ type: Number, min: 1, max: 45 }],
    drawType: { type: String, enum: ['random', 'algorithmic'], default: 'random' },
    status: { type: String, enum: ['simulation', 'published'], default: 'simulation' },
    prizePool: {
      total: { type: Number, default: 0 },
      jackpot: { type: Number, default: 0 },
      fourMatch: { type: Number, default: 0 },
      threeMatch: { type: Number, default: 0 },
      jackpotRolledOver: { type: Number, default: 0 },
    },
    winners: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        matchType: { type: String, enum: ['5-match', '4-match', '3-match'] },
        prizeAmount: { type: Number, default: 0 },
        paymentStatus: { type: String, enum: ['pending', 'paid', 'rejected'], default: 'pending' },
        proofUrl: { type: String, default: '' },
        verificationStatus: {
          type: String,
          enum: ['unsubmitted', 'pending', 'approved', 'rejected'],
          default: 'unsubmitted',
        },
        submittedAt: { type: Date },
        reviewedAt: { type: Date },
      },
    ],
    participantCount: { type: Number, default: 0 },
    jackpotRolledFromPrevious: { type: Number, default: 0 },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Unique draw per month/year
drawSchema.index({ month: 1, year: 1 }, { unique: true });

export const Draw = mongoose.model<IDraw>('Draw', drawSchema);
