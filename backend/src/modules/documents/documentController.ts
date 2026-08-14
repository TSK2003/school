import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { analyzeDocumentWithGemini } from '../ocr/geminiService.js';
import { compareNames } from '../../utils/nameMatcher.js';

const prisma = new PrismaClient();

/**
 * Handle document file upload
 */
export async function uploadDocument(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;
    const { type, studentId, applicationId } = req.body;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    if (!type || !['AADHAAR', 'BIRTH_CERTIFICATE', 'COMMUNITY_CERTIFICATE'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid document type. Must be AADHAAR, BIRTH_CERTIFICATE, or COMMUNITY_CERTIFICATE.'
      });
      return;
    }

    // Verify student exists if provided
    let targetAppId = applicationId;

    if (!targetAppId && studentId) {
      let app = await prisma.application.findFirst({
        where: {
          studentId,
          status: { in: ['DRAFT', 'SUBMITTED', 'PENDING_VERIFICATION'] }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!app) {
        const year = new Date().getFullYear();
        const rand = Math.floor(10000 + Math.random() * 90000);
        const appNumber = `APP-${year}-${rand}`;

        app = await prisma.application.create({
          data: {
            applicationNumber: appNumber,
            studentId,
            status: 'DRAFT'
          }
        });
      }
      targetAppId = app.id;
    }

    if (!targetAppId) {
      res.status(400).json({
        success: false,
        message: 'Either studentId or applicationId must be provided.'
      });
      return;
    }

    const existingDoc = await prisma.document.findFirst({
      where: {
        applicationId: targetAppId,
        type
      }
    });

    let document;

    if (existingDoc) {
      try {
        if (fs.existsSync(existingDoc.filePath)) {
          fs.unlinkSync(existingDoc.filePath);
        }
      } catch (err) {
        console.warn('Error deleting prior document file:', err);
      }

      document = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          fileName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          status: 'UPLOADED',
          ocrResult: null,
          extractedName: null,
          matchScore: null,
          uploadedAt: new Date(),
          processedAt: null
        }
      });
    } else {
      document = await prisma.document.create({
        data: {
          applicationId: targetAppId,
          type,
          fileName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          status: 'UPLOADED'
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: document.id,
        applicationId: targetAppId,
        type: document.type,
        fileName: document.fileName,
        fileSize: document.fileSize,
        fileType: document.fileType,
        status: document.status,
        uploadedAt: document.uploadedAt
      },
      message: 'Document uploaded successfully.'
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document.' });
  }
}

/**
 * Trigger AI OCR analysis and dual verification (Type + Name)
 */
export async function analyzeDocument(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            student: true
          }
        }
      }
    });

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const studentName = document.application?.student?.name || 'Student';

    // 1. Run Gemini Vision Analysis (Document Type + Entity Extraction)
    const ocrResult = await analyzeDocumentWithGemini(
      document.filePath,
      document.fileType || 'image/jpeg',
      document.type,
      studentName
    );

    // 2. Compute Fuzzy Name Matching
    const nameMatch = compareNames(studentName, ocrResult.studentName || '');

    // 3. Composite Verification (Both Type AND Name must match)
    const isDocTypeMatched = ocrResult.isDocTypeMatched;
    const isNameMatched = Boolean(ocrResult.studentName && nameMatch.status === 'MATCHED');
    const isOverallMatched = isDocTypeMatched && isNameMatched;

    let overallReason = '';
    if (isOverallMatched) {
      overallReason = 'Certificate type and student name verified successfully.';
    } else if (!isDocTypeMatched && !isNameMatched) {
      overallReason = `Document type mismatch (${ocrResult.docTypeLabel || ocrResult.detectedDocType} instead of ${document.type.replace(/_/g, ' ')}) AND student name mismatch.`;
    } else if (!isDocTypeMatched) {
      overallReason = ocrResult.docTypeMismatchReason || `Document type mismatch: detected ${ocrResult.docTypeLabel || ocrResult.detectedDocType} instead of required ${document.type.replace(/_/g, ' ')}.`;
    } else if (!ocrResult.studentName) {
      overallReason = 'Student name could not be found or read on the certificate.';
    } else {
      overallReason = `Name mismatch: certificate has "${ocrResult.studentName}", school record has "${studentName}".`;
    }

    const docStatus = isOverallMatched ? 'MATCHED' : 'MISMATCH';

    // Update document in database
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: docStatus,
        ocrResult: JSON.stringify({
          ...ocrResult,
          nameMatch,
          isDocTypeMatched,
          isNameMatched,
          isOverallMatched,
          overallReason
        }),
        extractedName: ocrResult.studentName,
        matchScore: isOverallMatched ? nameMatch.matchScore : (isDocTypeMatched ? nameMatch.matchScore : 0),
        processedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedDocument.id,
        type: updatedDocument.type,
        fileName: updatedDocument.fileName,
        status: updatedDocument.status,
        expectedDocType: document.type,
        detectedDocType: ocrResult.detectedDocType,
        docTypeLabel: ocrResult.docTypeLabel,
        isDocTypeMatched,
        docTypeMismatchReason: ocrResult.docTypeMismatchReason,
        extractedName: ocrResult.studentName,
        studentName,
        isNameMatched,
        isOverallMatched,
        overallReason,
        matchScore: nameMatch.matchScore,
        certificateNumber: ocrResult.certificateNumber,
        dateOfBirth: ocrResult.dateOfBirth,
        documentQuality: ocrResult.documentQuality,
        confidence: ocrResult.confidence,
        fieldsFound: ocrResult.fieldsFound,
        notes: ocrResult.notes,
        source: ocrResult.source
      },
      message: 'Document type and name verification completed.'
    });
  } catch (error: any) {
    console.error('Error analyzing document:', error);
    res.status(500).json({ success: false, message: 'Failed to analyze document.' });
  }
}

/**
 * Secure controlled document preview endpoint
 */
export async function previewDocument(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document || !fs.existsSync(document.filePath)) {
      res.status(404).json({ success: false, message: 'Document preview not available or file removed.' });
      return;
    }

    const safePath = path.resolve(document.filePath);
    res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    fs.createReadStream(safePath).pipe(res);
  } catch (error: any) {
    console.error('Error streaming document preview:', error);
    res.status(500).json({ success: false, message: 'Unable to load document preview.' });
  }
}
