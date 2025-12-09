import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Checking DATABASE_URL...")
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not defined in process.env")
  } else {
    console.log("DATABASE_URL is defined (length: " + process.env.DATABASE_URL.length + ")")
  }

  console.log("Attempting to connect to database...")
  try {
    await prisma.$connect()
    console.log("Successfully connected to database!")
    const count = await prisma.user.count()
    console.log("User count:", count)
  } catch (e) {
    console.error("Connection failed:", e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
