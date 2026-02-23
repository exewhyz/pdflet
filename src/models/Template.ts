import mongoose, { type Document, type Model, type Types } from 'mongoose';

export type TemplateCategory = 'professional' | 'creative' | 'academic' | 'technical' | 'minimal';

export interface ITemplate extends Document {
  name: string;
  slug: string;
  description: string;
  html: string;
  css: string;
  previewImageUrl: string | null;
  isPublic: boolean;
  projectId: Types.ObjectId | null;
  category: TemplateCategory;
  tags: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new mongoose.Schema<ITemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    html: {
      type: String,
      required: true,
    },
    css: {
      type: String,
      default: '',
    },
    previewImageUrl: {
      type: String,
      default: null,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: ['professional', 'creative', 'academic', 'technical', 'minimal'],
      default: 'professional',
    },
    tags: [String],
    version: {
      type: Number,
      default: 1,
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

const Template: Model<ITemplate> = mongoose.model<ITemplate>('Template', templateSchema);
export default Template;
