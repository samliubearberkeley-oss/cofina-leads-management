import { createClient } from '@insforge/sdk'
import { INSFORGE_CONFIG } from '../config/insforge.js'

// Initialize Insforge client
const client = createClient({ baseUrl: INSFORGE_CONFIG.baseUrl })

// Authentication state
let isAuthenticated = false
let authPromise = null

// Ensure authentication - creates anonymous user if needed
const ensureAuth = async () => {
  // Return existing promise if auth is in progress
  if (authPromise) {
    return authPromise
  }
  
  // Check if already authenticated
  if (isAuthenticated) {
    const { data } = await client.auth.getCurrentUser()
    if (data?.user) {
      return
    }
  }
  
  // Create and await auth promise
  authPromise = (async () => {
    try {
      // Check existing session
      const { data: sessionData } = await client.auth.getCurrentSession()
      if (sessionData?.session?.accessToken) {
        isAuthenticated = true
        return
      }
      
      // Try to sign in with anonymous credentials (stored in localStorage)
      const anonymousEmail = localStorage.getItem('insforge_anonymous_email')
      const anonymousPassword = localStorage.getItem('insforge_anonymous_password')
      
      if (anonymousEmail && anonymousPassword) {
        const { data, error } = await client.auth.signInWithPassword({
          email: anonymousEmail,
          password: anonymousPassword
        })
        
        if (!error && data?.user) {
          isAuthenticated = true
          return
        }
      }
      
      // Create new anonymous user
      const email = `anon_${Date.now()}@insforge.local`
      const password = `anon_${Math.random().toString(36).slice(2)}${Date.now()}`
      
      const { data, error } = await client.auth.signUp({
        email: email,
        password: password
      })
      
      if (error) {
        console.error('Failed to create anonymous user:', error)
        throw error
      }
      
      // Store credentials for future use
      localStorage.setItem('insforge_anonymous_email', email)
      localStorage.setItem('insforge_anonymous_password', password)
      
      isAuthenticated = true
    } catch (error) {
      console.error('Authentication error:', error)
      authPromise = null
      throw error
    } finally {
      authPromise = null
    }
  })()
  
  return authPromise
}

// Sheet names mapping
const sheetNames = [
  "LinkedIn Accepted",
  "a16z-gaming",
  "recent raised series B",
  "Seed Stage VC",
  "Series A",
  "Series Seed"
]

// Normalize LinkedIn URL (for matching)
const normalizeLinkedInUrl = (url) => {
  if (!url) return ''
  const urlStr = String(url).trim()
  if (!urlStr.startsWith('http')) return ''
  
  try {
    const urlObj = new URL(urlStr)
    let pathname = urlObj.pathname
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }
    return urlObj.origin + pathname
  } catch {
    return urlStr.split('?')[0].split('#')[0]
  }
}

// Extract columns from raw_data - this is the source of truth
const extractColumns = (records, isLinkedInAccepted) => {
  if (records.length === 0) return []
  
  // Extract columns from first record's raw_data
  const firstRecord = records[0]
  if (firstRecord.raw_data && typeof firstRecord.raw_data === 'object') {
    const rawColumns = Object.keys(firstRecord.raw_data)
    if (rawColumns.length > 0) {
      if (isLinkedInAccepted) {
        // LinkedIn Accepted: use columns from raw_data directly
        return rawColumns
      } else {
        // Other sheets: add linkedin accepted? and Accepted columns first
        return [
          'linkedin accepted?',
          'Accepted',
          ...rawColumns
        ]
      }
    }
  }
  
  // Fallback: use default columns
  if (isLinkedInAccepted) {
    return ['LinkedIn', 'Industry', 'Company Name', 'Funding Stage']
  }
  
  return [
    'linkedin accepted?',
    'Accepted',
    'Company Name',
    'Founder Name',
    'CEO',
    'CEO Email',
    'CEO Linkedin',
    'Linkedin Request?',
    'Connected?',
    'COO/CFO',
    'COO/CFO Linkedin',
    'Company Website',
    'Industry',
    'Funding Round',
    'Funding Amount (USD)',
    'Last Funding Date',
    'Lead Investor'
  ]
}

// Convert database record to table row format
const recordToRow = (record, columns, isLinkedInAccepted) => {
  const row = []
  
  if (isLinkedInAccepted) {
    // LinkedIn Accepted sheet: map columns directly from raw_data
    columns.forEach(col => {
      // Use raw_data as source of truth
      let value = ''
      if (record.raw_data && record.raw_data[col] !== undefined) {
        value = record.raw_data[col] || ''
      }
      row.push(value)
    })
  } else {
    // Other sheets: add linkedin accepted? and Accepted columns first
    row.push(record.linkedin_accepted ? '✓' : '') // linkedin accepted? column
    row.push(record.accepted ? '✓' : '') // Accepted column
    
    // Then add other columns from raw_data
    columns.forEach(col => {
      // Skip the first two columns we already added
      if (col === 'linkedin accepted?' || col === 'Accepted') {
        return
      }
      
      // Use raw_data as source of truth
      let value = ''
      if (record.raw_data && record.raw_data[col] !== undefined) {
        value = record.raw_data[col] || ''
      }
      
      row.push(value)
    })
  }
  
  return row
}

// Fetch all data from Insforge
export const fetchData = async () => {
  try {
    // Ensure authentication before fetching
    await ensureAuth()
    
    // Fetch all leads grouped by sheet_name
    const { data: allLeads, error } = await client.database
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching data from Insforge:', error)
      throw error
    }
    
    if (!allLeads || allLeads.length === 0) {
      console.warn('No data found in Insforge database')
      return {}
    }
    
    // Group by sheet_name
    const leadsBySheet = {}
    allLeads.forEach(lead => {
      const sheetName = lead.sheet_name || 'Unknown'
      if (!leadsBySheet[sheetName]) {
        leadsBySheet[sheetName] = []
      }
      leadsBySheet[sheetName].push(lead)
    })
    
    console.log('📊 Loaded sheets from database:', Object.keys(leadsBySheet).map(name => ({
      name,
      count: leadsBySheet[name].length
    })))
    
    // Build data structure for each sheet
    const allData = {}
    
    for (const sheetName of sheetNames) {
      const records = leadsBySheet[sheetName] || []
      const isLinkedInAccepted = sheetName === 'LinkedIn Accepted'
      
      if (records.length === 0) {
        console.warn(`⚠️ No records found for sheet: ${sheetName}`)
        // Still create empty data structure
        allData[sheetName] = {
          columns: [],
          data: []
        }
        continue
      }
      
      // Extract columns from raw_data
      const columns = extractColumns(records, isLinkedInAccepted)
      
      console.log(`✅ Processing sheet "${sheetName}": ${records.length} records, ${columns.length} columns`)
      
      // Convert records to rows
      const rows = records.map(record => recordToRow(record, columns, isLinkedInAccepted))
      
      // Sort rows: linkedin_accepted/accepted first
      if (!isLinkedInAccepted) {
        rows.sort((a, b) => {
          const aAccepted = a[0] === '✓'
          const bAccepted = b[0] === '✓'
          if (aAccepted && !bAccepted) return -1
          if (!aAccepted && bAccepted) return 1
          return 0
        })
      }
      
      allData[sheetName] = {
        columns: columns,
        data: rows
      }
    }
    
    console.log('📋 Final allData keys:', Object.keys(allData))
    
    // Handle LinkedIn Accepted matching
    if (allData['LinkedIn Accepted'] && allData['LinkedIn Accepted'].data.length > 0) {
      const linkedInAcceptedSheet = allData['LinkedIn Accepted']
      const linkedInUrls = linkedInAcceptedSheet.data.map(row => {
        const linkedInColIndex = linkedInAcceptedSheet.columns.indexOf('LinkedIn')
        return linkedInColIndex >= 0 ? normalizeLinkedInUrl(row[linkedInColIndex] || '') : ''
      }).filter(url => url)
      
      // Update linkedin_accepted flag in database for matching records
      for (const sheetName of sheetNames) {
        if (sheetName === 'LinkedIn Accepted') continue
        
        const records = leadsBySheet[sheetName] || []
        const updates = []
        
        records.forEach(record => {
          // Check all possible LinkedIn fields
          const recordLinkedIn = normalizeLinkedInUrl(
            record.linkedin || record.ceo_linkedin || record.coo_cfo_linkedin || ''
          )
          
          if (recordLinkedIn && linkedInUrls.includes(recordLinkedIn)) {
            if (!record.linkedin_accepted) {
              updates.push({
                id: record.id,
                linkedin_accepted: true
              })
            }
          }
        })
        
        // Batch update
        if (updates.length > 0) {
          for (const update of updates) {
            await client.database
              .from('leads')
              .update({ linkedin_accepted: true })
              .eq('id', update.id)
          }
        }
      }
      
      // Reload data after updates
      const { data: updatedLeads } = await client.database
        .from('leads')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (updatedLeads) {
        // Rebuild data structure with updated records
        const updatedLeadsBySheet = {}
        updatedLeads.forEach(lead => {
          const sheetName = lead.sheet_name || 'Unknown'
          if (!updatedLeadsBySheet[sheetName]) {
            updatedLeadsBySheet[sheetName] = []
          }
          updatedLeadsBySheet[sheetName].push(lead)
        })
        
        // Rebuild allData with updated records
        for (const sheetName of sheetNames) {
          const records = updatedLeadsBySheet[sheetName] || []
          const isLinkedInAccepted = sheetName === 'LinkedIn Accepted'
          const columns = extractColumns(records, isLinkedInAccepted)
          const rows = records.map(record => recordToRow(record, columns, isLinkedInAccepted))
          
          if (!isLinkedInAccepted) {
            rows.sort((a, b) => {
              const aAccepted = a[0] === '✓'
              const bAccepted = b[0] === '✓'
              if (aAccepted && !bAccepted) return -1
              if (!aAccepted && bAccepted) return 1
              return 0
            })
          }
          
          allData[sheetName] = {
            columns: columns,
            data: rows
          }
        }
      }
    }
    
    return allData
  } catch (error) {
    console.error('Error loading data:', error)
    throw error
  }
}

// Save data to Insforge
export const saveData = async (sheetName, editedData, accepted, linkedinAccepted) => {
  try {
    // Ensure authentication before saving
    await ensureAuth()
    
    // Fetch all leads for this sheet
    const { data: leads, error: fetchError } = await client.database
      .from('leads')
      .select('*')
      .eq('sheet_name', sheetName)
      .order('created_at', { ascending: true })
    
    if (fetchError) {
      throw fetchError
    }
    
    if (!leads || leads.length === 0) {
      console.warn(`No leads found for sheet: ${sheetName}`)
      return { status: 'success', message: 'No data to save' }
    }
    
    // Create a map of row index to lead ID
    // Note: This assumes the order matches the display order
    const rowToLeadMap = leads.map((lead, idx) => ({ rowIndex: idx, leadId: lead.id, lead: lead }))
    
    // Update accepted status
    if (accepted) {
      for (const [rowIdx, isAccepted] of Object.entries(accepted)) {
        const rowIndex = parseInt(rowIdx)
        if (rowIndex < rowToLeadMap.length) {
          const leadId = rowToLeadMap[rowIndex].leadId
          await client.database
            .from('leads')
            .update({ accepted: isAccepted })
            .eq('id', leadId)
        }
      }
    }
    
    // Update linkedin_accepted status
    if (linkedinAccepted) {
      for (const [rowIdx, isAccepted] of Object.entries(linkedinAccepted)) {
        const rowIndex = parseInt(rowIdx)
        if (rowIndex < rowToLeadMap.length) {
          const leadId = rowToLeadMap[rowIndex].leadId
          await client.database
            .from('leads')
            .update({ linkedin_accepted: isAccepted })
            .eq('id', leadId)
        }
      }
    }
    
    // Update edited data - store in raw_data
    if (editedData) {
      for (const [rowIdx, rowData] of Object.entries(editedData)) {
        const rowIndex = parseInt(rowIdx)
        if (rowIndex < rowToLeadMap.length) {
          const leadId = rowToLeadMap[rowIndex].leadId
          const lead = rowToLeadMap[rowIndex].lead
          
          // Get current raw_data
          const currentRawData = lead.raw_data || {}
          
          // Build updated raw_data
          const updatedRawData = { ...currentRawData }
          
          // Map column indices to column names
          const isLinkedInAccepted = sheetName === 'LinkedIn Accepted'
          const columns = extractColumns([lead], isLinkedInAccepted)
          
          // Update raw_data with edited values
          Object.entries(rowData).forEach(([colIdx, value]) => {
            const colIndex = parseInt(colIdx)
            if (isLinkedInAccepted) {
              // Direct column mapping
              if (colIndex < columns.length) {
                updatedRawData[columns[colIndex]] = value
              }
            } else {
              // Skip first two columns (linkedin accepted?, Accepted)
              if (colIndex >= 2 && colIndex - 2 < columns.length) {
                const actualColIndex = colIndex - 2
                updatedRawData[columns[actualColIndex]] = value
              }
            }
          })
          
          // Update the record
          await client.database
            .from('leads')
            .update({ raw_data: updatedRawData })
            .eq('id', leadId)
        }
      }
    }
    
    return { status: 'success', message: 'Data saved successfully' }
  } catch (error) {
    console.error('Error saving data:', error)
    throw error
  }
}
