import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveGeminiApiKey } from '../ocr/geminiService.js';

const prisma = new PrismaClient();

const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.7-flash',
  'gemini-3.5-flash'
];

function maskApiKey(key: string | null): string | null {
  if (!key || key.trim().length === 0) return null;
  const clean = key.trim();
  if (clean.length <= 6) return '••••••••';
  const lastFour = clean.slice(-4);
  return `••••••••••••${lastFour}`;
}

export async function getSettings(_req: Request, res: Response): Promise<void> {
  try {
    const activeKey = await getActiveGeminiApiKey();

    res.json({
      success: true,
      data: {
        activeProvider: 'GEMINI',
        gemini: {
          configured: Boolean(activeKey),
          maskedKey: maskApiKey(activeKey)
        },
        systemEnvironment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve settings.' });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const { geminiApiKey } = req.body;

    const trimmedKey = typeof geminiApiKey === 'string' ? geminiApiKey.trim() : null;

    const setting: any = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        geminiApiKey: trimmedKey
      },
      update: {
        geminiApiKey: trimmedKey
      }
    });

    res.json({
      success: true,
      data: {
        activeProvider: 'GEMINI',
        gemini: {
          configured: Boolean(setting?.geminiApiKey),
          maskedKey: maskApiKey(setting?.geminiApiKey)
        }
      },
      message: 'Gemini API settings updated successfully.'
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
}

export async function testGeminiConnection(_req: Request, res: Response): Promise<void> {
  try {
    const activeKey = await getActiveGeminiApiKey();

    if (!activeKey) {
      res.json({
        success: true,
        data: {
          status: 'STANDBY',
          message: 'No Gemini key configured. Built-in intelligent demo analyzer is active.'
        }
      });
      return;
    }

    const genAI = new GoogleGenerativeAI(activeKey);
    let lastError: any = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Respond with the single word: CONNECTED');
        const response = await result.response;
        const reply = response.text()?.trim() || 'CONNECTED';

        res.json({
          success: true,
          data: {
            status: 'CONNECTED',
            message: `Successfully connected to Google Gemini Vision API (${modelName}).`,
            model: modelName,
            reply
          }
        });
        return;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Test Ping] ${modelName} error:`, err?.message || err);
      }
    }

    res.status(400).json({
      success: false,
      message: `Gemini connection failed: ${lastError?.message || 'API error'}`
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Connection test error: ${error?.message || error}`
    });
  }
}
