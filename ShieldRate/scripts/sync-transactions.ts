/**
 * Transaction Sync Script
 * 
 * Syncs historical Stripe charges to the database for CE 3.0 matching
 * 
 * Usage:
 *   npx tsx scripts/sync-transactions.ts [limit]
 *   npx tsx scripts/sync-transactions.ts --months 12  (12-month backfill)
 * 
 * Examples:
 *   npx tsx scripts/sync-transactions.ts 1000
 *   npx tsx scripts/sync-transactions.ts --months 12  (CRITICAL for new merchants)
 */

import { syncHistoricalTransactions, syncLast12Months } from '../lib/transaction-sync'

async function main() {
  const args = process.argv.slice(2)
  
  // Check for --months flag
  const monthsIndex = args.indexOf('--months')
  if (monthsIndex !== -1 && args[monthsIndex + 1] === '12') {
    // 12-month backfill (critical for new merchants)
    console.log('🔄 Starting 12-month backfill sync...\n')
    console.log('⚠️  This is critical for CE 3.0 matching (requires 120-365 day history)\n')
    
    try {
      const result = await syncLast12Months()
      
      console.log('\n✅ 12-Month Backfill Complete!\n')
      console.log('📊 Results:')
      console.log(`   Total processed: ${result.total}`)
      console.log(`   Synced: ${result.synced}`)
      console.log(`   Skipped (already exists): ${result.skipped}`)
      console.log(`   Errors: ${result.errors}`)
      console.log(`\n✨ Vantirs is now ready for CE 3.0 matching!`)
      return
    } catch (error: any) {
      console.error('❌ Backfill failed:', error.message)
      process.exit(1)
    }
  }
  
  // Default: sync with limit
  const limit = args[0] ? parseInt(args[0]) : 100

  console.log(`🔄 Starting transaction sync (limit: ${limit})...\n`)

  try {
    const result = await syncHistoricalTransactions(limit)

    console.log('\n✅ Sync Complete!\n')
    console.log('📊 Results:')
    console.log(`   Total processed: ${result.total}`)
    console.log(`   Synced: ${result.synced}`)
    console.log(`   Skipped (already exists): ${result.skipped}`)
    console.log(`   Errors: ${result.errors}`)
    console.log(`\n💡 Tip: For new merchants, run: npx tsx scripts/sync-transactions.ts --months 12`)
  } catch (error: any) {
    console.error('❌ Sync failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

