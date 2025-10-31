#!/usr/bin/env node
/**
 * Import CSV data to Insforge database with proper schema mapping
 * Usage: node import-to-insforge.js
 */

import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV file mapping
const csvFiles = {
  "LinkedIn Accepted": "public/leads - LinkedIn Accepted.csv",
  "a16z-gaming": "public/leads - a16z-gaming.csv",
  "recent raised series B": "public/leads - recent raised series B (2).csv",
  "Seed Stage VC": "public/leads - Seed Stage VC (1).csv",
  "Series A": "public/leads - Series A (1).csv",
  "Series Seed": "public/leads - Series Seed (2).csv"
};

// Normalize LinkedIn URL
function normalizeLinkedInUrl(url) {
  if (!url) return '';
  const urlStr = String(url).trim();
  if (!urlStr.startsWith('http')) return '';
  
  try {
    const urlObj = new URL(urlStr);
    let pathname = urlObj.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return urlObj.origin + pathname;
  } catch {
    let cleaned = urlStr.split('?')[0].split('#')[0];
    if (cleaned.endsWith('/') && cleaned !== '/') {
      cleaned = cleaned.slice(0, -1);
    }
    return cleaned;
  }
}

// Map CSV row to database record based on sheet type
function mapRowToRecord(row, columns, sheetName) {
  const record = {
    sheet_name: sheetName,
    category: sheetName,
    raw_data: row, // Store complete raw data
    linkedin_accepted: false,
    accepted: false
  };

  // Map based on sheet-specific structure
  switch (sheetName) {
    case "LinkedIn Accepted":
      record.linkedin = normalizeLinkedInUrl(row['LinkedIn'] || '');
      record.industry = row['Industry'] || '';
      record.company_name = row['Company Name'] || '';
      record.funding_stage = row['Funding Stage'] || '';
      break;

    case "Series A":
    case "Series Seed":
      record.company_name = row['Company Name'] || '';
      record.founder_name = row['Founder Name'] || '';
      record.ceo = row['CEO'] || '';
      record.ceo_email = row['CEO Email'] || '';
      record.ceo_linkedin = normalizeLinkedInUrl(row['CEO Linkedin'] || '');
      record.linkedin = normalizeLinkedInUrl(row['CEO Linkedin'] || '');
      record.linkedin_request = row['Linkedin Request?'] || '';
      record.connected = row['Connected?'] || '';
      record.coo_cfo = row['COO/CFO'] || row['COO/CFO '] || '';
      record.coo_cfo_linkedin = normalizeLinkedInUrl(row['COO/CFO Linkedin'] || '');
      record.company_website = row['Company Website'] || '';
      record.industry = row['Industry'] || '';
      record.funding_round = row['Funding Round'] || '';
      record.funding_amount_usd = row['Funding Amount (USD)'] || '';
      record.last_funding_date = row['Last Funding Date'] || null;
      record.lead_investor = row['Lead Investor'] || '';
      break;

    case "a16z-gaming":
      record.company_name = row['Company Name'] || '';
      record.cohort = row['Cohort'] || '';
      record.location = row['Location'] || '';
      record.ceo = row['CEO'] || '';
      record.linkedin = normalizeLinkedInUrl(row['LinkedIn'] || '');
      record.company_website = row['Website'] || '';
      record.website = row['Website'] || '';
      record.description = row['Description'] || '';
      break;

    case "Seed Stage VC":
      record.vc_name = row['VC Name'] || '';
      record.partner = row['Partner'] || '';
      record.linkedin = normalizeLinkedInUrl(row['Linkedin'] || '');
      record.linkedin_request = row['Linkedin Request?'] || '';
      record.connected = row['Connected?'] || '';
      break;

    case "recent raised series B":
      record.organization_name = row['Organization Name'] || '';
      record.company_name = row['Organization Name'] || '';
      record.organization_industries = row['Organization Industries'] || '';
      record.industry = row['Organization Industries'] || '';
      record.organization_location = row['Organization Location'] || '';
      record.location = row['Organization Location'] || '';
      record.funding_type = row['Funding Type'] || '';
      record.money_raised = row['Money Raised'] || '';
      record.money_raised_currency = row['Money Raised Currency'] || '';
      record.money_raised_usd = row['Money Raised (in USD)'] || '';
      record.funding_amount_usd = row['Money Raised (in USD)'] || '';
      record.announced_date = row['Announced Date'] || null;
      record.last_funding_date = row['Announced Date'] || null;
      record.description = row['Description'] || '';
      record.funding_stage = row['Funding Stage'] || '';
      record.lead_investor = row['Lead Investors'] || '';
      record.investor_names = row['Investor Names'] || '';
      record.funding_status = row['Funding Status'] || '';
      record.transaction_name = row['Transaction Name'] || '';
      record.ceo = row['CEO Name'] || '';
      record.ceo_linkedin = normalizeLinkedInUrl(row['CEO Linkedin'] || '');
      record.linkedin = normalizeLinkedInUrl(row['CEO Linkedin'] || '');
      record.company_website = row['Company Website'] || '';
      break;

    default:
      // Generic mapping for unknown sheets
      columns.forEach(col => {
        const value = row[col] || '';
        const lowerCol = col.toLowerCase();
        
        if (lowerCol.includes('company name')) {
          record.company_name = value;
        } else if (lowerCol.includes('linkedin') && !lowerCol.includes('request') && !lowerCol.includes('accepted')) {
          record.linkedin = normalizeLinkedInUrl(value);
          if (!record.ceo_linkedin) record.ceo_linkedin = normalizeLinkedInUrl(value);
        } else if (lowerCol.includes('ceo linkedin')) {
          record.ceo_linkedin = normalizeLinkedInUrl(value);
          if (!record.linkedin) record.linkedin = normalizeLinkedInUrl(value);
        } else if (lowerCol.includes('ceo email')) {
          record.ceo_email = value;
        } else if (lowerCol === 'ceo') {
          record.ceo = value;
        } else if (lowerCol.includes('website')) {
          record.company_website = value;
          if (!record.website) record.website = value;
        } else if (lowerCol === 'industry') {
          record.industry = value;
        }
      });
  }

  return record;
}

// Process CSV and create JSON file for bulk import
async function processCSV(sheetName, csvPath) {
  try {
    console.log(`\n📂 Processing ${sheetName}...`);
    
    const fullPath = path.join(__dirname, csvPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      return null;
    }

    const csvContent = fs.readFileSync(fullPath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const columns = results.meta.fields || [];
            const rows = results.data;
            
            console.log(`  Found ${rows.length} rows`);
            console.log(`  Columns: ${columns.join(', ')}`);
            
            const records = rows.map(row => mapRowToRecord(row, columns, sheetName));
            
            // Save to JSON file
            const jsonPath = path.join(__dirname, `temp_${sheetName.replace(/\s+/g, '_')}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf-8');
            
            console.log(`  ✅ Created JSON file: ${jsonPath}`);
            resolve({ jsonPath, count: records.length });
          } catch (error) {
            console.error(`  ❌ Error processing ${sheetName}:`, error);
            reject(error);
          }
        },
        error: (error) => {
          console.error(`  ❌ CSV parsing error for ${sheetName}:`, error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`❌ Failed to process ${sheetName}:`, error);
    throw error;
  }
}

// Main processing function
async function main() {
  console.log('🚀 Processing CSV files for Insforge import...');
  console.log('='.repeat(60));
  
  const results = {};
  
  for (const [sheetName, csvPath] of Object.entries(csvFiles)) {
    try {
      const result = await processCSV(sheetName, csvPath);
      if (result) {
        results[sheetName] = result;
      }
    } catch (error) {
      console.error(`Failed to process ${sheetName}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Processing Summary:');
  console.log('='.repeat(60));
  
  let total = 0;
  for (const [sheetName, result] of Object.entries(results)) {
    console.log(`  ${sheetName}: ${result.count} rows -> ${result.jsonPath}`);
    total += result.count;
  }
  
  console.log('='.repeat(60));
  console.log(`✅ Total processed: ${total} rows`);
  console.log('='.repeat(60));
  console.log('\n💡 Next step: Use bulk-upsert MCP tool to import each JSON file');
  console.log('   Example: bulk-upsert table=leads filePath=temp_LinkedIn_Accepted.json');
}

// Run processing
main().catch(console.error);
