import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/db/store';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ResellerRow {
  name: string;
  referral_code: string;
}

interface UploadResult {
  success: boolean;
  row: number;
  name?: string;
  referral_code?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    let rows: ResellerRow[] = [];

    // Parse file based on type
    if (fileName.endsWith('.csv')) {
      const text = await file.text();
      const parsed = Papa.parse<ResellerRow>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      });
      rows = parsed.data;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
      
      // Normalize column names
      rows = jsonData.map(row => {
        const normalized: Record<string, string> = {};
        Object.keys(row).forEach(key => {
          normalized[key.trim().toLowerCase().replace(/\s+/g, '_')] = row[key];
        });
        return {
          name: normalized.name || '',
          referral_code: normalized.referral_code || normalized.code || '',
        };
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload CSV or Excel file.' },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found in file' },
        { status: 400 }
      );
    }

    // Get existing resellers to check for duplicates
    const existingResellers = await store.getAllResellers();
    const existingCodes = new Set(existingResellers.map(r => r.referral_code.toLowerCase()));

    const results: UploadResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header, and we're 0-indexed

      // Validate required fields
      if (!row.name || !row.name.trim()) {
        results.push({ success: false, row: rowNum, error: 'Name is required' });
        errorCount++;
        continue;
      }

      if (!row.referral_code || !row.referral_code.trim()) {
        results.push({ success: false, row: rowNum, name: row.name, error: 'Referral code is required' });
        errorCount++;
        continue;
      }

      // Clean referral code
      const cleanCode = row.referral_code.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');

      if (cleanCode.length < 2) {
        results.push({ 
          success: false, 
          row: rowNum, 
          name: row.name, 
          referral_code: row.referral_code,
          error: 'Referral code must be at least 2 characters' 
        });
        errorCount++;
        continue;
      }

      // Check for duplicates
      if (existingCodes.has(cleanCode)) {
        results.push({ 
          success: false, 
          row: rowNum, 
          name: row.name, 
          referral_code: cleanCode,
          error: 'Referral code already exists' 
        });
        errorCount++;
        continue;
      }

      // Create reseller
      try {
        await store.createReseller({
          name: row.name.trim(),
          referral_code: cleanCode,
          total_referrals: 0,
          total_revenue: 0,
        });

        existingCodes.add(cleanCode); // Add to set to prevent duplicates within same file
        results.push({ 
          success: true, 
          row: rowNum, 
          name: row.name.trim(), 
          referral_code: cleanCode 
        });
        successCount++;
      } catch (error) {
        results.push({ 
          success: false, 
          row: rowNum, 
          name: row.name, 
          referral_code: cleanCode,
          error: error instanceof Error ? error.message : 'Failed to create reseller' 
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: rows.length,
        success_count: successCount,
        error_count: errorCount,
        results,
      },
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
