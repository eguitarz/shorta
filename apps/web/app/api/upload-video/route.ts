import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithCsrf } from '@/lib/auth-helpers';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Maximum video duration: 3 minutes
const MAX_DURATION_SECONDS = 180;
// Maximum file size: 500MB
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

// Supported video MIME types
const SUPPORTED_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/mpeg',
];

/**
 * POST /api/upload-video
 * Upload a video file to Gemini's File API
 * Returns the file URI for use in analysis
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const authError = await requireAuthWithCsrf(request);
  if (authError) return authError;

  let tempFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const duration = formData.get('duration') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Unsupported video format',
          details: `Supported formats: MP4, WebM, MOV, AVI. Got: ${file.type}`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: 'File too large',
          details: `Maximum file size is 500MB. Your file: ${(file.size / (1024 * 1024)).toFixed(1)}MB`
        },
        { status: 400 }
      );
    }

    // Validate duration if provided (optional - client may not be able to read it)
    if (duration) {
      const durationSeconds = parseFloat(duration);
      if (isNaN(durationSeconds)) {
        return NextResponse.json(
          {
            error: 'Invalid duration value',
            details: 'Unable to parse video duration.'
          },
          { status: 400 }
        );
      }

      if (durationSeconds > MAX_DURATION_SECONDS) {
        return NextResponse.json(
          {
            error: 'Video too long',
            details: `Maximum duration is 3 minutes. Your video: ${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, '0')}`
          },
          { status: 400 }
        );
      }
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey });

    // Write file to temp directory (Gemini SDK needs file path)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create temp file with proper extension
    const ext = path.extname(file.name) || '.mp4';
    tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}${ext}`);
    fs.writeFileSync(tempFilePath, buffer);

    console.log(`[Upload] Starting upload: ${file.name}, ${(file.size / (1024 * 1024)).toFixed(2)}MB, type: ${file.type}`);

    // Upload to Gemini using the new SDK
    const uploadedFile = await ai.files.upload({
      file: tempFilePath,
      config: {
        mimeType: file.type,
        displayName: file.name,
      },
    });

    console.log(`[Upload] Upload initiated:`, uploadedFile);

    // Wait for file processing if needed
    let fileInfo = uploadedFile;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait

    while (fileInfo.state === 'PROCESSING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const fileList = await ai.files.get({ name: fileInfo.name! });
      fileInfo = fileList;
      attempts++;
      console.log(`[Upload] Processing... attempt ${attempts}, state: ${fileInfo.state}`);
    }

    if (fileInfo.state !== 'ACTIVE') {
      console.error(`[Upload] File processing failed: ${fileInfo.state}`);
      return NextResponse.json(
        { error: 'Video processing failed. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[Upload] Success! File URI: ${fileInfo.uri}`);

    return NextResponse.json({
      success: true,
      fileUri: fileInfo.uri,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

  } catch (error) {
    console.error('Upload video API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }
    }
  }
}
