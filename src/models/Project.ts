import mongoose, { type Document, type Model, type Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IApiKey {
  _id: Types.ObjectId;
  key: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IProject extends Document {
  name: string;
  owner: Types.ObjectId;
  apiKeys: IApiKey[];
  webhookUrl: string | null;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  usageCount: number;
  usageLimits: {
    maxPdfsPerMonth: number;
    maxBulkSize: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new mongoose.Schema<IApiKey>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: (): string => `pk_${uuidv4().replace(/-/g, '')}`,
    },
    label: {
      type: String,
      default: 'Default',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const projectSchema = new mongoose.Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    apiKeys: [apiKeySchema],
    webhookUrl: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'],
      default: 'free',
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    usageLimits: {
      maxPdfsPerMonth: { type: Number, default: 100 },
      maxBulkSize: { type: Number, default: 10 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

projectSchema.index({ 'apiKeys.key': 1 });

const Project: Model<IProject> = mongoose.model<IProject>('Project', projectSchema);
export default Project;
