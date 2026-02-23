import mongoose, { type Document, type Model, type Types } from 'mongoose';

export interface IAtsScore {
  total: number | null;
  breakdown: {
    skills: number | null;
    experience: number | null;
    summary: number | null;
    structure: number | null;
  };
}

export interface IJob extends Document {
  projectId: Types.ObjectId;
  templateSlug: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfUrl: string | null;
  cloudinaryPublicId: string | null;
  atsScore: IAtsScore;
  resumeData: Record<string, unknown>;
  bulkJobId: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
  notifyEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new mongoose.Schema<IJob>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    templateSlug: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    atsScore: {
      total: { type: Number, default: null },
      breakdown: {
        skills: { type: Number, default: null },
        experience: { type: Number, default: null },
        summary: { type: Number, default: null },
        structure: { type: Number, default: null },
      },
    },
    resumeData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    bulkJobId: {
      type: String,
      default: null,
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notifyEmail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret.__v;
        delete ret.resumeData;
        return ret;
      },
    },
  },
);

const Job: Model<IJob> = mongoose.model<IJob>('Job', jobSchema);
export default Job;
