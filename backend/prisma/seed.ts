import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const FIRST_NAMES = [
  'Aadhavan', 'Aarav', 'Abhinav', 'Aditi', 'Advait', 'Akshara', 'Alok', 'Amrita', 'Ananya', 'Anirudh',
  'Anoushka', 'Arjun', 'Arya', 'Ashwin', 'Atharv', 'Avani', 'Ayush', 'Bhavna', 'Chetan', 'Deepak',
  'Devika', 'Dhruv', 'Diya', 'Divya', 'Gautam', 'Gitanjali', 'Harini', 'Harish', 'Ishaan', 'Isha',
  'Janani', 'Kalyan', 'Karthik', 'Kavya', 'Keerthana', 'Krishna', 'Kunal', 'Lakshmi', 'Madhav', 'Meera',
  'Mithun', 'Nandini', 'Navin', 'Neha', 'Nikhil', 'Nithya', 'Pooja', 'Pranav', 'Prashant', 'Priya',
  'Rahul', 'Rakesh', 'Rhea', 'Rishabh', 'Rohan', 'Rohit', 'Sakshi', 'Sameer', 'Sanjay', 'Sanvi',
  'Shreya', 'Siddharth', 'Sneha', 'Sourabh', 'Srinivas', 'Surya', 'Swati', 'Tanvi', 'Tarun', 'Tejas',
  'Varun', 'Venkatesh', 'Vidya', 'Vikram', 'Vimal', 'Vishal', 'Yash', 'Yukta', 'Zara'
];

const LAST_NAMES = [
  'Agarwal', 'Balaji', 'Bose', 'Chandran', 'Chawla', 'Deshmukh', 'Gupta', 'Iyer', 'Joshi', 'Kapoor',
  'Kumar', 'Menon', 'Mishra', 'Mukherjee', 'Nair', 'Nambiar', 'Patel', 'Pillai', 'Prasad', 'Rajan',
  'Raman', 'Rao', 'Reddy', 'Roy', 'Sarin', 'Sen', 'Sharma', 'Singh', 'Sundaram', 'Swaminathan',
  'Tiwari', 'Varma', 'Venkataraman', 'Verma', 'Yadav'
];

const ALL_STANDARDS = [
  'PreKG', 'LKG', 'UKG',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

const SECTIONS = ['A', 'B'];

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clear existing records
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.student.deleteMany();
  await prisma.staff.deleteMany();
  console.log('✓ Cleared previous database records');

  // Seed Staff Accounts
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  await prisma.staff.createMany({
    data: [
      {
        name: 'School Administrator',
        email: 'admin@school.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN'
      },
      {
        name: 'Verification Staff',
        email: 'staff@school.com',
        passwordHash: staffPasswordHash,
        role: 'STAFF'
      }
    ]
  });
  console.log('✓ Created Staff Accounts (admin@school.com, staff@school.com)');

  // Seed students across PreKG to XII
  const studentsData: any[] = [];
  let nameIndex = 0;

  for (const std of ALL_STANDARDS) {
    for (const sec of SECTIONS) {
      for (let i = 1; i <= 6; i++) {
        const firstName = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
        const lastName = LAST_NAMES[(nameIndex + i) % LAST_NAMES.length];
        nameIndex++;

        studentsData.push({
          name: `${firstName} ${lastName}`,
          standard: std,
          section: sec,
          academicYear: '2025-2026'
        });
      }
    }
  }

  await prisma.student.createMany({
    data: studentsData
  });
  console.log(`✓ Seeded ${studentsData.length} students across PreKG to XII (Sections A & B)`);

  // Ensure Default System Setting exists
  const envKey = process.env.GEMINI_API_KEY || null;
  await prisma.systemSetting.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      activeProvider: 'GEMINI',
      geminiApiKey: envKey
    },
    update: {
      activeProvider: 'GEMINI',
      ...(envKey ? { geminiApiKey: envKey } : {})
    }
  });

  console.log('✓ Verification queue starts clean (0 pending applications).');
  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
