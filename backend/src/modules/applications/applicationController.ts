import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Submit / Finalize student application from Parent Portal
 */
export async function submitApplication(req: Request, res: Response): Promise<void> {
  try {
    const { studentId, applicationId, remarks } = req.body;

    if (!studentId && !applicationId) {
      res.status(400).json({
        success: false,
        message: 'Student ID or Application ID is required.'
      });
      return;
    }

    let app;
    if (applicationId) {
      app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { documents: true, student: true }
      });
    } else {
      app = await prisma.application.findFirst({
        where: {
          studentId,
          status: { in: ['DRAFT', 'SUBMITTED', 'PENDING_VERIFICATION'] }
        },
        include: { documents: true, student: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!app) {
      // Create new application
      const year = new Date().getFullYear();
      const rand = Math.floor(10000 + Math.random() * 90000);
      const appNumber = `APP-${year}-${rand}`;

      app = await prisma.application.create({
        data: {
          applicationNumber: appNumber,
          studentId,
          status: 'PENDING_VERIFICATION',
          submittedAt: new Date(),
          remarks: remarks || null
        },
        include: { documents: true, student: true }
      });
    } else {
      app = await prisma.application.update({
        where: { id: app.id },
        data: {
          status: 'PENDING_VERIFICATION',
          submittedAt: new Date(),
          remarks: remarks !== undefined ? remarks : app.remarks
        },
        include: { documents: true, student: true }
      });
    }

    res.json({
      success: true,
      data: app,
      message: 'Application submitted successfully for staff verification.'
    });
  } catch (error: any) {
    console.error('Error submitting application:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
}

/**
 * Get pending verification applications queue for Admin Portal
 */
export async function getPendingApplications(req: Request, res: Response): Promise<void> {
  try {
    const search = String(req.query.search || '').trim();
    const standard = String(req.query.standard || '').trim();

    const where: any = {
      status: 'PENDING_VERIFICATION'
    };

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { student: { name: { contains: search } } }
      ];
    }

    if (standard && standard !== 'ALL') {
      where.student = {
        ...(where.student || {}),
        standard
      };
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        student: true,
        documents: {
          select: {
            id: true,
            type: true,
            status: true,
            matchScore: true,
            fileName: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    console.error('Error fetching pending applications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending applications.' });
  }
}

/**
 * Get all applications with search and filters
 */
export async function getApplications(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '15'), 10)));
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const standard = String(req.query.standard || '').trim();

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { student: { name: { contains: search } } }
      ];
    }

    if (standard && standard !== 'ALL') {
      where.student = {
        ...(where.student || {}),
        standard
      };
    }

    const [total, applications] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          student: true,
          documents: true
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve applications.' });
  }
}

/**
 * Get detailed application by ID
 */
export async function getApplicationById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: true,
        documents: {
          orderBy: { uploadedAt: 'asc' }
        }
      }
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error: any) {
    console.error('Error fetching application by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve application details.' });
  }
}
