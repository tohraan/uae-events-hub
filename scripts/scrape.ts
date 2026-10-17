import { runScrapers } from '../src/lib/ingest'
import { prisma } from '../src/lib/db'

async function main() {
  const only = process.argv.slice(2)
  const results = await runScrapers(only.length ? only : undefined)
  console.table(results)
  await prisma.$disconnect()
  process.exit(results.every(r => r.error) ? 1 : 0)
}
main()
