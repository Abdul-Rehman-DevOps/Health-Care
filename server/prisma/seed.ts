import { PrismaClient } from '@prisma/client';
import { hashPassword } from './lib/password.js';

const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: 'admin', password: 'admin', displayName: 'Administrator', role: 'admin' },
    { username: 'desolate', password: 'desolate', displayName: 'Desolate', role: 'user' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      create: {
        username: u.username,
        passwordHash: hashPassword(u.password),
        displayName: u.displayName,
        role: u.role,
      },
      update: {
        passwordHash: hashPassword(u.password),
        displayName: u.displayName,
        role: u.role,
      },
    });
  }
  await prisma.systemCounter.upsert({
    where: { name: 'patient' },
    create: { name: 'patient', value: 1000 },
    update: {},
  });

  const settings = await prisma.hospitalSettings.findFirst();
  if (!settings) {
    await prisma.hospitalSettings.create({
      data: {
        hospitalName: 'Health Care',
        contact: '03000000000',
        email: 'info@healthcare.local',
        address: 'Main Street',
        city: 'Islamabad',
        tagline: 'Caring for Life',
        currency: 'PKR',
      },
    });
  }

  const deptCount = await prisma.department.count();
  let gopdId: string | undefined;
  if (deptCount === 0) {
    const departments = [
      { name: 'General OPD', code: 'GOPD', description: 'General Out-Patient', color: '#0D9488' },
      { name: 'Gynaecology', code: 'GYN', description: 'Gynaecology & Obstetrics', color: '#BE185D' },
      { name: 'Paediatrics', code: 'PED', description: 'Paediatrics', color: '#0891B2' },
      { name: 'ENT', code: 'ENT', description: 'Ear, Nose & Throat', color: '#7C3AED' },
    ];
    for (const d of departments) {
      const created = await prisma.department.create({ data: d });
      if (d.code === 'GOPD') gopdId = created.id;
    }
  } else {
    const gopd = await prisma.department.findFirst({ where: { code: 'GOPD' } });
    gopdId = gopd?.id;
  }

  const doctorCount = await prisma.doctor.count();
  if (doctorCount === 0) {
    await prisma.doctor.createMany({
      data: [
        {
          name: 'Dr. Sarah Ahmed',
          specialization: 'General Physician',
          departmentId: gopdId,
          fee: 1500,
          contact: '03001234567',
        },
        {
          name: 'Dr. Ali Khan',
          specialization: 'Paediatrician',
          fee: 2000,
          contact: '03007654321',
        },
      ],
    });
  }

  const drugCount = await prisma.drug.count();
  if (drugCount === 0) {
    const drugs = [
      { name: 'Paracetamol 500mg', genericName: 'Paracetamol', category: 'Analgesic', salePrice: 25, stockQuantity: 200 },
      { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotic', salePrice: 85, stockQuantity: 50 },
      { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'GI', salePrice: 95, stockQuantity: 90 },
      { name: 'Metformin 500mg', genericName: 'Metformin', category: 'Antidiabetic', salePrice: 85, stockQuantity: 80 },
    ];
    for (const drug of drugs) {
      await prisma.drug.create({ data: drug });
    }
  }

  const labCount = await prisma.labTest.count();
  if (labCount === 0) {
    const tests = [
      { name: 'Complete Blood Count (CBC)', code: 'CBC', category: 'Haematology', price: 350 },
      { name: 'Blood Glucose (Fasting)', code: 'FBS', category: 'Biochemistry', price: 150 },
      { name: 'HbA1c', code: 'HBA1C', category: 'Biochemistry', price: 600 },
    ];
    for (const t of tests) {
      await prisma.labTest.create({ data: t });
    }
  }

  console.log('Health Care database seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
