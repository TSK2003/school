import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';

const prisma = new PrismaClient();

/**
 * Staff approves student application
 */
export async function approveApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffName = req.user?.name || 'Staff Member';

    const existing = await prisma.application.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    // Update application and all child documents
    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          remarks: remarks || existing.remarks,
          verifiedAt: new Date(),
          verifiedBy: staffName
        },
        include: {
          student: true,
          documents: true
        }
      }),
      prisma.document.updateMany({
        where: { applicationId: id },
        data: {
          status: 'STAFF_APPROVED',
          verifiedAt: new Date()
        }
      })
    ]);

    res.json({
      success: true,
      data: updatedApp,
      message: `Application ${updatedApp.applicationNumber} has been verified and approved.`
    });
  } catch (error: any) {
    console.error('Error approving application:', error);
    res.status(500).json({ success: false, message: 'Failed to approve application.' });
  }
}

/**
 * Staff rejects student application (Remarks are mandatory)
 */
export async function rejectApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffName = req.user?.name || 'Staff Member';

    if (!remarks || remarks.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Rejection remarks are mandatory. Please state the reason for rejection.'
      });
      return;
    }

    const existing = await prisma.application.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const [updatedApp] = await prisma.$transaction([
      prisma.application.update({
        where: { id },
        data: {
          status: 'REJECTED',
          remarks: remarks.trim(),
          verifiedAt: new Date(),
          verifiedBy: staffName
        },
        include: {
          student: true,
          documents: true
        }
      }),
      prisma.document.updateMany({
        where: { applicationId: id },
        data: {
          status: 'STAFF_REJECTED',
          verifiedAt: new Date()
        }
      })
    ]);

    res.json({
      success: true,
      data: updatedApp,
      message: `Application ${updatedApp.applicationNumber} has been rejected.`
    });
  } catch (error: any) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ success: false, message: 'Failed to reject application.' });
  }
}
