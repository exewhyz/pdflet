import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import type { AuthenticatedRequest } from '../../middleware/apiKeyAuth.js';
import Project from '../../models/Project.js';
import User from '../../models/User.js';
import Job from '../../models/Job.js';

const DEFAULT_USER_EMAIL = 'admin@resumeforge.local';

/**
 * Ensure a default owner user exists for project creation.
 */
async function getOrCreateDefaultUser(): Promise<mongoose.Types.ObjectId> {
  let user = await User.findOne({ email: DEFAULT_USER_EMAIL });
  if (!user) {
    user = await User.create({
      email: DEFAULT_USER_EMAIL,
      name: 'Admin',
      passwordHash: 'seeded-no-login',
    });
  }
  return user._id as mongoose.Types.ObjectId;
}

/**
 * GET /v1/project — Return project info for the authenticated project.
 */
export async function getProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const project = req.project;
    const totalJobs = await Job.countDocuments({ projectId: req.projectId });
    const completedJobs = await Job.countDocuments({
      projectId: req.projectId,
      status: 'completed',
    });

    res.json({
      id: project._id,
      name: project.name,
      plan: project.plan,
      usageCount: project.usageCount,
      usageLimits: project.usageLimits,
      webhookUrl: project.webhookUrl,
      apiKeys: project.apiKeys.map((k) => ({
        id: k._id,
        label: k.label,
        key: `${k.key.slice(0, 8)}...${k.key.slice(-4)}`,
        isActive: k.isActive,
        createdAt: k.createdAt,
      })),
      stats: {
        totalJobs,
        completedJobs,
      },
      createdAt: project.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/projects — List all projects (dashboard admin view).
 */
export async function listProjects(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projects = await Project.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const projectList = await Promise.all(
      projects.map(async (p) => {
        const totalJobs = await Job.countDocuments({ projectId: p._id });
        const completedJobs = await Job.countDocuments({
          projectId: p._id,
          status: 'completed',
        });
        return {
          id: p._id,
          name: p.name,
          plan: p.plan,
          usageCount: p.usageCount,
          usageLimits: p.usageLimits,
          webhookUrl: p.webhookUrl,
          apiKeyCount: p.apiKeys.length,
          apiKey: p.apiKeys[0]?.key || null,
          apiKeyMasked: p.apiKeys[0]
            ? `${p.apiKeys[0].key.slice(0, 8)}...${p.apiKeys[0].key.slice(-4)}`
            : null,
          stats: { totalJobs, completedJobs },
          createdAt: p.createdAt,
        };
      }),
    );

    res.json({ projects: projectList, total: projectList.length });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/projects — Create a new project/organisation.
 */
export async function createProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, plan, webhookUrl } = req.body as {
      name?: string;
      plan?: string;
      webhookUrl?: string;
    };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Project name is required.' });
      return;
    }

    const ownerId = await getOrCreateDefaultUser();

    const project = await Project.create({
      name: name.trim(),
      owner: ownerId,
      apiKeys: [{ label: 'Default Key' }],
      plan: plan || 'free',
      webhookUrl: webhookUrl || null,
    });

    const apiKey = project.apiKeys[0]!;

    res.status(201).json({
      id: project._id,
      name: project.name,
      plan: project.plan,
      apiKey: {
        id: apiKey._id,
        key: apiKey.key, // full key shown only on creation
        label: apiKey.label,
      },
      createdAt: project.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /v1/project — Update the authenticated project.
 */
export async function updateProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, webhookUrl } = req.body as {
      name?: string;
      webhookUrl?: string;
    };

    const project = req.project;
    if (name) project.name = name.trim();
    if (webhookUrl !== undefined) project.webhookUrl = webhookUrl || null;
    await project.save();

    res.json({
      id: project._id,
      name: project.name,
      webhookUrl: project.webhookUrl,
      updatedAt: project.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /v1/project — Soft-delete the authenticated project.
 */
export async function deleteProject(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    req.project.isActive = false;
    await req.project.save();
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    next(err);
  }
}
