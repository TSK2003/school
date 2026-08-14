import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

const STANDARD_ORDER = [
  'PreKG', 'LKG', 'UKG',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

function getStandardSortIndex(std: string): number {
  const clean = std.trim();
  const idx = STANDARD_ORDER.indexOf(clean);
  if (idx !== -1) return idx;
  const num = parseInt(clean, 10);
  if (!isNaN(num)) return num + 10;
  return 999;
}

/**
 * Get distinct options for dropdowns (Standards, Sections, Academic Years)
 */
export async function getDropdownOptions(_req: Request, res: Response): Promise<void> {
  try {
    const students = await prisma.student.findMany({
      select: {
        standard: true,
        section: true,
        academicYear: true
      },
      distinct: ['standard', 'section', 'academicYear']
    });

    const defaultStandards = [
      'PreKG', 'LKG', 'UKG',
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
    ];

    const dbStandards = Array.from(new Set(students.map(s => s.standard)));
    const combinedStandards = Array.from(new Set([...defaultStandards, ...dbStandards]))
      .sort((a, b) => getStandardSortIndex(a) - getStandardSortIndex(b));

    const defaultSections = ['A', 'B', 'C', 'D'];
    const dbSections = Array.from(new Set(students.map(s => s.section)));
    const sections = Array.from(new Set([...defaultSections, ...dbSections])).sort();

    const academicYears = Array.from(new Set([
      '2025-2026',
      ...students.map(s => s.academicYear)
    ])).sort().reverse();

    res.json({
      success: true,
      data: {
        standards: combinedStandards,
        sections,
        academicYears
      }
    });
  } catch (error: any) {
    console.error('Error fetching dropdown options:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve options.' });
  }
}

/**
 * Parent portal cascade: Get students for given standard and section
 */
export async function getStudentsByStandardAndSection(req: Request, res: Response): Promise<void> {
  try {
    const { standard, section } = req.query;

    if (!standard || !section) {
      res.status(400).json({
        success: false,
        message: 'Both standard and section query parameters are required.'
      });
      return;
    }

    const students = await prisma.student.findMany({
      where: {
        standard: String(standard),
        section: String(section)
      },
      select: {
        id: true,
        name: true,
        standard: true,
        section: true,
        academicYear: true,
        applications: {
          select: {
            id: true,
            applicationNumber: true,
            status: true,
            submittedAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: students
    });
  } catch (error: any) {
    console.error('Error retrieving students by standard/section:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve students.' });
  }
}

/**
 * Admin portal: Search & filter students with pagination
 */
export async function getStudents(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '15'), 10)));
    const search = String(req.query.search || '').trim();
    const standard = String(req.query.standard || '').trim();
    const section = String(req.query.section || '').trim();
    const academicYear = String(req.query.academicYear || '').trim();
    const status = String(req.query.status || '').trim();

    const where: any = {};

    if (search) {
      where.name = {
        contains: search
      };
    }

    if (standard && standard !== 'ALL') {
      where.standard = standard;
    }

    if (section && section !== 'ALL') {
      where.section = section;
    }

    if (academicYear && academicYear !== 'ALL') {
      where.academicYear = academicYear;
    }

    if (status && status !== 'ALL') {
      if (status === 'NOT_SUBMITTED') {
        where.applications = {
          none: {}
        };
      } else {
        where.applications = {
          some: {
            status: status
          }
        };
      }
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          applications: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              documents: {
                select: {
                  id: true,
                  type: true,
                  status: true,
                  matchScore: true
                }
              }
            }
          }
        },
        orderBy: [{ standard: 'asc' }, { section: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    // Sort students by standard hierarchy
    students.sort((a, b) => {
      const stdDiff = getStandardSortIndex(a.standard) - getStandardSortIndex(b.standard);
      if (stdDiff !== 0) return stdDiff;
      const secDiff = a.section.localeCompare(b.section);
      if (secDiff !== 0) return secDiff;
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching students list:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve students list.' });
  }
}

/**
 * Get individual student with complete application history
 */
export async function getStudentById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            documents: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error: any) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student details.' });
  }
}

/**
 * Admin portal: Create a new student profile
 */
export async function createStudent(req: Request, res: Response): Promise<void> {
  try {
    const { name, standard, section, academicYear } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Student full name is required.' });
      return;
    }

    if (!standard || !String(standard).trim()) {
      res.status(400).json({ success: false, message: 'Standard / Grade is required.' });
      return;
    }

    if (!section || !String(section).trim()) {
      res.status(400).json({ success: false, message: 'Section is required.' });
      return;
    }

    const student = await prisma.student.create({
      data: {
        name: name.trim(),
        standard: String(standard).trim(),
        section: String(section).trim().toUpperCase(),
        academicYear: academicYear?.trim() || '2025-2026'
      }
    });

    res.json({
      success: true,
      data: student,
      message: 'Student record added successfully.'
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'Failed to create student record.' });
  }
}

/**
 * Admin portal: Delete a student record and all associated records
 */
export async function deleteStudent(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            documents: true
          }
        }
      }
    });

    if (!student) {
      res.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    // Clean up uploaded document files on disk if any
    for (const app of student.applications) {
      for (const doc of app.documents) {
        try {
          if (doc.filePath && fs.existsSync(doc.filePath)) {
            fs.unlinkSync(doc.filePath);
          }
        } catch (e) {
          console.warn('Could not delete file on disk:', doc.filePath);
        }
      }
    }

    // Delete student (Cascade deletes applications and documents)
    await prisma.student.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Student ${student.name} deleted successfully.`
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Failed to delete student record.' });
  }
}
