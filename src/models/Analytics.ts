import mongoose, { type Document, type Model, type Types } from 'mongoose';

export type AnalyticsEvent =
  | 'pdf_generated'
  | 'pdf_failed'
  | 'bulk_job_started'
  | 'bulk_job_completed'
  | 'template_used'
  | 'template_created'
  | 'ats_score_computed'
  | 'webhook_sent'
  | 'email_sent';

export interface IAnalytics extends Document {
  event: AnalyticsEvent;
  projectId: Types.ObjectId;
  jobId: Types.ObjectId | null;
  templateSlug: string | null;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new mongoose.Schema<IAnalytics>(
  {
    event: {
      type: String,
      required: true,
      enum: [
        'pdf_generated',
        'pdf_failed',
        'bulk_job_started',
        'bulk_job_completed',
        'template_used',
        'template_created',
        'ats_score_computed',
        'webhook_sent',
        'email_sent',
      ],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    templateSlug: {
      type: String,
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

analyticsSchema.index({ projectId: 1, event: 1, createdAt: -1 });

const Analytics: Model<IAnalytics> = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export default Analytics;
