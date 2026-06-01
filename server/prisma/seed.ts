import { PrismaClient } from '@prisma/client';
import { hashPassword } from './lib/password.js';

const prisma = new PrismaClient();

/** LifeCare Hospital contact (prescription pad footer) */
const CLINIC_PHONE = '30011777479';
const CLINIC_EMAIL = 'lifecarehospital.islamabad@gmail.com';

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
      // Do not overwrite password on restart; preserves credentials changed in Settings
      update: {
        displayName: u.displayName,
        role: u.role,
      },
    });
  }
  for (const name of ['patient', 'visit', 'bill']) {
    await prisma.systemCounter.upsert({
      where: { name },
      create: { name, value: 1000 },
      update: {},
    });
  }

  const settings = await prisma.hospitalSettings.findFirst();
  if (!settings) {
    await prisma.hospitalSettings.create({
      data: {
        hospitalName: 'LifeCare Hospital',
        contact: CLINIC_PHONE,
        email: CLINIC_EMAIL,
        address: 'H#12, Abbasi Rd, Bani Gala',
        city: 'Islamabad',
        tagline: 'Caring for Life',
        currency: 'PKR',
        logoUrl: '/hospital-logo-brand.png',
      },
    });
  } else if (process.env.SEED_FORCE === '1') {
    await prisma.hospitalSettings.update({
      where: { id: settings.id },
      data: {
        hospitalName: settings.hospitalName || 'LifeCare Hospital',
        contact: settings.contact || CLINIC_PHONE,
        email: settings.email || CLINIC_EMAIL,
        address: settings.address || 'H#12, Abbasi Rd, Bani Gala',
        city: settings.city || 'Islamabad',
        logoUrl:
          !settings.logoUrl ||
          settings.logoUrl === '/hospital-logo.svg' ||
          settings.logoUrl === '/hospital-logo-icon.svg' ||
          settings.logoUrl === '/hospital-logo.png'
            ? '/hospital-logo-brand.png'
            : settings.logoUrl,
      },
    });
  } else if (
    !settings.logoUrl ||
    settings.logoUrl === '/hospital-logo.svg' ||
    settings.logoUrl === '/hospital-logo-icon.svg'
  ) {
    await prisma.hospitalSettings.update({
      where: { id: settings.id },
      data: { logoUrl: '/hospital-logo.png' },
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

  const gyn = await prisma.department.findFirst({ where: { code: 'GYN' } });
  const ped = await prisma.department.findFirst({ where: { code: 'PED' } });

  const lifecareDoctors = [
    {
      name: 'Dr. Waqas Ahmad Satti',
      specialization: 'Neurologist / Diabetologist',
      qualification: 'MBBS, MD (Neurology)',
      qualificationsExtra: 'Diploma in Diabetes and Weight Management',
      prescriptionTemplate: 'full',
      departmentId: gopdId,
      fee: 2500,
      contact: CLINIC_PHONE,
      email: CLINIC_EMAIL,
    },
    {
      name: 'Dr. Muhammad Usman',
      specialization: 'General Physician / Sr. Medical Officer',
      qualification: 'BSc, MBBS, RMP',
      qualificationsExtra: null,
      prescriptionTemplate: 'standard',
      departmentId: gopdId,
      fee: 1500,
      contact: CLINIC_PHONE,
      email: CLINIC_EMAIL,
    },
    {
      name: 'Dr. Memoona Munawar',
      specialization: 'Consultant Obstetrician & Gynecologist',
      qualification: 'MBBS, FCPS GYNAE & OBS, CHPE',
      qualificationsExtra:
        'Certified in Diagnostic Ultrasound IIS\nMaster Trainer in Lactation Management (UNICEF)\nDiploma in Gynecological Laparoscopic Surgery, UKSH Germany',
      prescriptionTemplate: 'minimal',
      departmentId: gyn?.id,
      fee: 3500,
      contact: CLINIC_PHONE,
      email: CLINIC_EMAIL,
    },
    {
      name: 'Dr. Ammara Tanweer',
      specialization: 'Child Specialist',
      qualification: 'MBBS, FCPS (Paeds & Neonatology)',
      qualificationsExtra: null,
      prescriptionTemplate: 'pediatric',
      departmentId: ped?.id,
      fee: 2000,
      contact: CLINIC_PHONE,
      email: CLINIC_EMAIL,
    },
    {
      name: 'Dr. Komal Usman',
      specialization: 'General Medicine',
      qualification: 'MBBS',
      qualificationsExtra: null,
      prescriptionTemplate: 'banner',
      departmentId: gopdId,
      fee: 1200,
      contact: CLINIC_PHONE,
      email: CLINIC_EMAIL,
    },
  ];

  const komalExisting = await prisma.doctor.findFirst({
    where: { name: { contains: 'Komal Usman', mode: 'insensitive' } },
  });
  if (komalExisting && komalExisting.prescriptionTemplate !== 'banner') {
    await prisma.doctor.update({
      where: { id: komalExisting.id },
      data: { prescriptionTemplate: 'banner' },
    });
  }

  const memoonaExisting = await prisma.doctor.findFirst({
    where: { name: { contains: 'Memoona', mode: 'insensitive' } },
  });
  if (memoonaExisting && memoonaExisting.prescriptionTemplate !== 'minimal') {
    await prisma.doctor.update({
      where: { id: memoonaExisting.id },
      data: { prescriptionTemplate: 'minimal' },
    });
  }

  for (const doc of lifecareDoctors) {
    const existing = await prisma.doctor.findFirst({
      where: { name: { equals: doc.name, mode: 'insensitive' } },
    });
    if (existing) {
      if (process.env.SEED_FORCE === '1') {
        await prisma.doctor.update({
          where: { id: existing.id },
          data: {
            specialization: doc.specialization,
            qualification: doc.qualification,
            qualificationsExtra: doc.qualificationsExtra,
            prescriptionTemplate: doc.prescriptionTemplate,
            departmentId: doc.departmentId ?? null,
            fee: doc.fee,
            contact: doc.contact,
            email: doc.email,
            isActive: true,
          },
        });
      }
    } else {
      await prisma.doctor.create({ data: doc });
    }
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
