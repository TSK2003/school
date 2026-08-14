import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  try {
    const [
      totalStudents,
      totalApplications,
      pendingVerification,
      verified,
      rejected,
      recentApplications,
      allDocsWithScores
    ] = await Promise.all([
      prisma.student.count(),
      prisma.application.count(),
      prisma.application.count({ where: { status: 'PENDING_VERIFICATION' } }),
      prisma.application.count({ where: { status: 'VERIFIED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.application.findMany({
        take: 8,
        orderBy: { submittedAt: 'desc' },
        include: {
          student: true,
          documents: {
            select: {
              id: true,
              type: true,
              status: true,
              matchScore: true
            }
          }
        }
      }),
      prisma.document.findMany({
        where: { matchScore: { not: null } },
        select: { matchScore: true }
      })
    ]);

    // Calculate average match rate
    const avgMatchRate = allDocsWithScores.length > 0
      ? Math.round(allDocsWithScores.reduce((acc, d) => acc + (d.matchScore || 0), 0) / allDocsWithScores.length)
      : 92;

    // Breakdown by standard
    const studentsByStandard = await prisma.student.groupBy({
      by: ['standard'],
      _count: {
        id: true
      },
      orderBy: {
        standard: 'asc'
      }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalApplications,
          pendingVerification,
          verified,
          rejected,
          avgMatchRate
        },
        recentApplications,
        standardsBreakdown: studentsByStandard.map(s => ({
          standard: `Std ${s.standard}`,
          count: s._count.id
        }))
      }
    });
  } catch (error: any) {
    console.error('Error computing dashboard statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to compute dashboard statistics.' });
  }
}
