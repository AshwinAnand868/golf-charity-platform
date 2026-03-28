import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent {
  title: string;
  date: Date;
  description: string;
  location: string;
}

export interface ICharity extends Document {
  name: string;
  description: string;
  logo: string;
  images: string[];
  website: string;
  category: string;
  featured: boolean;
  events: IEvent[];
  totalReceived: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const charitySchema = new Schema<ICharity>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    logo: { type: String, default: '' },
    images: [{ type: String }],
    website: { type: String, default: '' },
    category: { type: String, default: 'General' },
    featured: { type: Boolean, default: false },
    events: [
      {
        title: { type: String, required: true },
        date: { type: Date, required: true },
        description: { type: String, default: '' },
        location: { type: String, default: '' },
      },
    ],
    totalReceived: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Charity = mongoose.model<ICharity>('Charity', charitySchema);
