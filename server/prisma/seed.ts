import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Authentic Indian Names Dataset
const FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Muhammad', 'Sai', 'Arnav', 'Ayaan',
  'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryav', 'Dhruv', 'Kabir',
  'Rudra', 'Rohan', 'Kunal', 'Dev', 'Samar', 'Aryan', 'Ayush', 'Utkarsh', 'Yash', 'Tushar',
  'Manish', 'Harsh', 'Varun', 'Nikhil', 'Gaurav', 'Aniket', 'Siddharth', 'Abhishek', 'Mayank', 'Prakhar',
  'Shashank', 'Saurabh', 'Karan', 'Chirag', 'Rahul', 'Kartik', 'Hemant', 'Tanmay', 'Alok', 'Sachin',
  'Rajat', 'Pankaj', 'Bhavya', 'Ansh', 'Om', 'Sanjay', 'Suraj', 'Vikram', 'Naveen', 'Rakesh',
];

const FIRST_NAMES_FEMALE = [
  'Aadhya', 'Ananya', 'Aanya', 'Saanvi', 'Kiara', 'Myra', 'Pari', 'Diya', 'Anika', 'Ira',
  'Navya', 'Riya', 'Avani', 'Shanaya', 'Sara', 'Prisha', 'Siya', 'Jiya', 'Kavya', 'Sneha',
  'Pooja', 'Divya', 'Neha', 'Shreya', 'Anjali', 'Tanvi', 'Isha', 'Simran', 'Palak', 'Swati',
  'Megha', 'Payal', 'Aditi', 'Sakshi', 'Kritika', 'Ritika', 'Mansi', 'Muskan', 'Sonali', 'Komal',
  'Akanksha', 'Garima', 'Deepika', 'Rashmi', 'Nandini', 'Bhavna', 'Vandana', 'Shruti', 'Priyanka', 'Radhika',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Joshi', 'Mehta', 'Shah', 'Agarwal',
  'Mishra', 'Pandey', 'Tiwari', 'Bhatnagar', 'Dubey', 'Saxena', 'Srivastava', 'Chauhan', 'Yadav', 'Reddy',
  'Nair', 'Iyer', 'Menon', 'Pillai', 'Rao', 'Kulkarni', 'Deshmukh', 'Patil', 'Shinde', 'Jadhav',
  'Banerjee', 'Chatterjee', 'Mukherjee', 'Bose', 'Dutta', 'Ghosh', 'Sen', 'Choudhury', 'Das', 'Roy',
  'Bhardwaj', 'Malhotra', 'Kapoor', 'Khanna', 'Chopra', 'Arora', 'Bhatia', 'Kohli', 'Sethi', 'Grover',
];

const INDIAN_CITIES = [
  { city: 'Kota', state: 'Rajasthan', pincode: '324005' },
  { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
  { city: 'Delhi', state: 'Delhi NCR', pincode: '110001' },
  { city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' },
  { city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001' },
  { city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001' },
  { city: 'Patna', state: 'Bihar', pincode: '800001' },
  { city: 'Ranchi', state: 'Jharkhand', pincode: '834001' },
  { city: 'Indore', state: 'Madhya Pradesh', pincode: '452001' },
  { city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001' },
  { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Nagpur', state: 'Maharashtra', pincode: '440001' },
  { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
  { city: 'Surat', state: 'Gujarat', pincode: '395001' },
  { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
  { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
  { city: 'Chandigarh', state: 'Punjab & Haryana', pincode: '160001' },
];

async function main() {
  console.log('--- Seeding Clean Day 1 with Individual Login Accounts for All Students & Faculty ---');

  // 1. Wipe previous records
  await prisma.doubt.deleteMany();
  await prisma.studyMaterial.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.feeInstallment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.result.deleteMany();
  await prisma.examination.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.course.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  console.log('✔ Database wiped clean.');

  // 2. Settings (Indian Coaching Institute in INR ₹)
  const defaultSettings = [
    { key: 'instituteName', value: 'Apex Career Institute (Kota & National Centres)', description: 'Premier Coaching for JEE, NEET & Foundation' },
    { key: 'currencySymbol', value: '₹', description: 'Indian Rupee Symbol' },
    { key: 'currencyCode', value: 'INR', description: 'Indian National Rupee' },
    { key: 'contactPhone', value: '+91 (0744) 275-8000', description: 'Central Helpdesk' },
    { key: 'contactEmail', value: 'admissions@apexkota.edu.in', description: 'Central Admissions Desk' },
    { key: 'address', value: 'Apex Knowledge Park, Road No. 1, IPIA, Kota, Rajasthan - 324005', description: 'Headquarters' },
    { key: 'academicYear', value: '2026-2027', description: 'Academic Session' },
    { key: 'website', value: 'https://apexkota.edu.in', description: 'Official Portal' },
    { key: 'gstin', value: '08AAAAA9999Z1Z5', description: 'GST Registration' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.create({ data: s });
  }
  console.log('✔ Seeded Institute Settings (Currency: ₹ INR).');

  // Pre-hash default passwords for instant performance
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('Admin@123', salt);
  const accountantPass = await bcrypt.hash('Accountant@123', salt);
  const teacherPass = await bcrypt.hash('Teacher@123', salt);
  const studentPass = await bcrypt.hash('Student@123', salt);

  // 3. Admin & Accountant Master Logins
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@tuition.edu',
      passwordHash: adminPass,
      role: 'ADMINISTRATOR',
      status: 'ACTIVE',
    },
  });

  await prisma.user.create({
    data: {
      username: 'accountant',
      email: 'accountant@tuition.edu',
      passwordHash: accountantPass,
      role: 'ACCOUNTANT',
      status: 'ACTIVE',
    },
  });
  console.log('✔ Seeded Administrator & Accountant Master Accounts.');

  // 4. Classrooms & Venues
  const classroomDefs = [
    { roomId: 'CLR-2026-0001', name: 'Aryabhata Lecture Hall 101', capacity: 100, roomType: 'LECTURE_HALL', building: 'Academic Block A - Floor 1', facilities: 'Dual 4K Laser Projectors, Central AC, JBL Surround Sound, Tiered Amphitheater Seating' },
    { roomId: 'CLR-2026-0002', name: 'Ramanujan Smart Class 102', capacity: 80, roomType: 'SMART_CLASS', building: 'Academic Block A - Floor 1', facilities: '86-inch Interactive Touch Display, 4K Lecture Recording Rig, High-Speed WiFi' },
    { roomId: 'CLR-2026-0003', name: 'C.V. Raman Physics Hall 201', capacity: 90, roomType: 'LECTURE_HALL', building: 'Physics Wing - Floor 2', facilities: 'Demonstration Benches, High-Framerate Mechanics Sensors, Dual Projectors, AC' },
    { roomId: 'CLR-2026-0004', name: 'Homi Bhabha Science Theatre 202', capacity: 85, roomType: 'SMART_CLASS', building: 'Science Wing - Floor 2', facilities: 'Interactive Digital Whiteboard, Ergonomic Desks, Central AC' },
    { roomId: 'CLR-2026-0005', name: 'A.P.J. Abdul Kalam Auditorium', capacity: 350, roomType: 'AUDITORIUM', building: 'Central Block - Ground Floor', facilities: 'Full Stage, Audio-Visual Console, Acoustic Wall Panels, High-Capacity Air Filtration' },
    { roomId: 'CLR-2026-0006', name: 'J.C. Bose Bio-Lab 301', capacity: 50, roomType: 'SCIENCE_LAB', building: 'Medical Wing - Floor 3', facilities: 'High-Resolution Binocular Microscopes, Anatomical Models, Digital Slides' },
    { roomId: 'CLR-2026-0007', name: 'P.C. Ray Chemistry Lab 302', capacity: 50, roomType: 'SCIENCE_LAB', building: 'Chemical Sciences Wing - Floor 3', facilities: 'Fume Hoods, Analytical Balances, Chemical Safety Showers, Titration Rigs' },
    { roomId: 'CLR-2026-0008', name: 'Visvesvaraya Computer Lab 401', capacity: 60, roomType: 'COMPUTER_LAB', building: 'Technology Wing - Floor 4', facilities: 'Core i7 Workstations, Dual Monitors, Gigabit LAN, 100% UPS Inverter Backup' },
    { roomId: 'CLR-2026-0009', name: 'Vikram Sarabhai Smart Suite A', capacity: 60, roomType: 'SMART_CLASS', building: 'Academic Block B - Floor 1', facilities: 'Smart Interactive Board, Video Conferencing, High-Speed WiFi' },
    { roomId: 'CLR-2026-0010', name: 'Satyendra Nath Bose Hall B', capacity: 75, roomType: 'LECTURE_HALL', building: 'Academic Block B - Floor 2', facilities: 'Projector, Mic & Sound System, Central AC' },
    { roomId: 'CLR-2026-0011', name: 'Birbal Sahni Botanical Lab', capacity: 45, roomType: 'SCIENCE_LAB', building: 'Medical Wing - Floor 3', facilities: 'Plant Specimen Racks, Compound Microscopes, Digital Herbarium' },
    { roomId: 'CLR-2026-0012', name: 'Meghnad Saha Astro-Physics Lab', capacity: 50, roomType: 'SCIENCE_LAB', building: 'Physics Wing - Floor 3', facilities: 'Spectrometers, Optical Benches, Interferometers' },
  ];

  for (const c of classroomDefs) {
    await prisma.classroom.create({
      data: {
        ...c,
        status: 'AVAILABLE',
      },
    });
  }
  console.log(`✔ Seeded ${classroomDefs.length} Classrooms.`);

  // 5. Faculty Mentors (24 Subject Specialists - Each with their own dedicated User Login)
  const facultyDefs = [
    { first: 'Dr. Rajesh Kumar', last: 'Sharma', subject: 'Physics', qual: 'Ph.D. in Physics (IIT Delhi), 16 yrs Kota exp', exp: 16, sal: 180000 },
    { first: 'Prof. Anand', last: 'Verma', subject: 'Mathematics', qual: 'B.Tech (IIT Kanpur), Math Olympiad Trainer', exp: 14, sal: 175000 },
    { first: 'Dr. Meenakshi', last: 'Sundaram', subject: 'Chemistry', qual: 'Ph.D. in Organic Chemistry (IISc Bangalore)', exp: 15, sal: 170000 },
    { first: 'Dr. Vikramaditya', last: 'Rathore', subject: 'Physical Chemistry', qual: 'M.Sc. (IIT Bombay), CSIR NET AIR-4', exp: 11, sal: 145000 },
    { first: 'Prof. Sunita', last: 'Deshmukh', subject: 'Botany', qual: 'M.Sc. in Plant Sciences (Delhi University)', exp: 13, sal: 150000 },
    { first: 'Dr. Amit', last: 'Banerjee', subject: 'Zoology', qual: 'Ph.D. in Human Physiology (AIIMS New Delhi)', exp: 12, sal: 155000 },
    { first: 'Pooja', last: 'Iyer', subject: 'Mental Ability', qual: 'M.Sc. in Applied Statistics (ISI Kolkata)', exp: 9, sal: 120000 },
    { first: 'Sanjay', last: 'Kulkarni', subject: 'Mathematics', qual: 'B.Tech (IIT Kharagpur)', exp: 10, sal: 140000 },
    { first: 'Dr. Tariq', last: 'Mansoor', subject: 'Physics', qual: 'Ph.D. in High Energy Physics (TIFR Mumbai)', exp: 18, sal: 195000 },
    { first: 'Prof. Harish', last: 'Chandra', subject: 'Inorganic Chemistry', qual: 'M.Sc. (IIT Roorkee), 12 yrs Kota exp', exp: 12, sal: 140000 },
    { first: 'Dr. Ananya', last: 'Roy', subject: 'Biology', qual: 'M.Sc., Ph.D. in Molecular Biology (JNU)', exp: 8, sal: 125000 },
    { first: 'Deepak', last: 'Aggarwal', subject: 'Physics', qual: 'B.Tech (IIT BHU Varanasi)', exp: 9, sal: 135000 },
    { first: 'Dr. Geeta', last: 'Pillai', subject: 'Botany', qual: 'Ph.D. (University of Hyderabad)', exp: 10, sal: 130000 },
    { first: 'Rohan', last: 'Singhania', subject: 'Mathematics', qual: 'B.Tech (IIT Guwahati)', exp: 7, sal: 115000 },
    { first: 'Swati', last: 'Bhattacharya', subject: 'English & Social Science', qual: 'M.A. (St. Stephen’s College, Delhi)', exp: 10, sal: 110000 },
    { first: 'Manoj', last: 'Pandey', subject: 'Physics', qual: 'M.Sc. in Applied Physics (NIT Kurukshetra)', exp: 11, sal: 130000 },
    { first: 'Kavita', last: 'Nambiar', subject: 'Zoology', qual: 'M.Sc. in Zoology (Madras University)', exp: 9, sal: 125000 },
    { first: 'Suresh', last: 'Joshi', subject: 'Chemistry', qual: 'M.Sc. (IIT Madras)', exp: 12, sal: 145000 },
    { first: 'Priyanka', last: 'Mukherjee', subject: 'Mathematics', qual: 'M.Sc. in Mathematics (Presidency College)', exp: 8, sal: 120000 },
    { first: 'Alok', last: 'Tripathi', subject: 'Physics', qual: 'B.Tech (IIT Kharagpur)', exp: 14, sal: 165000 },
    { first: 'Neeraj', last: 'Gupta', subject: 'Physical Chemistry', qual: 'Ph.D. in Chemical Sciences (BITS Pilani)', exp: 11, sal: 140000 },
    { first: 'Rashmi', last: 'Nair', subject: 'Biology', qual: 'M.Sc. in Biotechnology', exp: 7, sal: 110000 },
    { first: 'Subhash', last: 'Chandra', subject: 'Mathematics', qual: 'B.Tech (IIT Delhi)', exp: 13, sal: 160000 },
    { first: 'Bhavna', last: 'Saxena', subject: 'Inorganic Chemistry', qual: 'M.Sc. in Chemistry (BHU)', exp: 9, sal: 125000 },
  ];

  for (let i = 0; i < facultyDefs.length; i++) {
    const f = facultyDefs[i];
    const cleanFirst = f.first.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = f.last.toLowerCase().replace(/[^a-z]/g, '');
    const email = `faculty.${cleanFirst}.${cleanLast}@apexkota.edu.in`;
    const username = i === 0 ? 'teacher' : `fac.${cleanFirst}.${cleanLast}`;

    // Create User login for each faculty member
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: teacherPass, // Password: Teacher@123 (or Faculty@123)
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    // Create Faculty linked to User
    await prisma.faculty.create({
      data: {
        facultyId: `FAC-2026-${String(i + 1).padStart(4, '0')}`,
        userId: user.id,
        firstName: f.first,
        lastName: f.last,
        phone: `+91 98${String(20000000 + i)}`,
        email,
        subjectTaught: f.subject,
        qualification: f.qual,
        experienceYears: f.exp,
        joiningDate: '2026-09-01',
        salary: f.sal,
        status: 'ACTIVE',
      },
    });
  }
  console.log(`✔ Seeded ${facultyDefs.length} Faculty Instructors with Dedicated User Logins (Password: Teacher@123).`);

  // 6. 1,000 Indian Students - Each with their own dedicated User Login Account
  console.log('Generating 1000 User Logins & Student Records...');
  const TOTAL_STUDENTS = 1000;
  const usersToInsert = [];
  const studentsToInsert = [];

  for (let i = 0; i < TOTAL_STUDENTS; i++) {
    const isMale = i % 2 === 0;
    const firstName = isMale
      ? FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length]
      : FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length];
    const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const location = INDIAN_CITIES[i % INDIAN_CITIES.length];

    const userId = crypto.randomUUID();
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const email = `student.${cleanFirst}.${cleanLast}${i + 1}@apexkota.edu.in`;
    const username = i === 0 ? 'student' : `stu.${cleanFirst}.${cleanLast}${i + 1}`;

    usersToInsert.push({
      id: userId,
      username,
      email,
      passwordHash: studentPass, // Password: Student@123
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    const studentId = `STU-2026-${String(i + 1).padStart(4, '0')}`;
    const rollNumber = `26ADM${String(1001 + i)}`;

    const guardianFirst = FIRST_NAMES_MALE[(i * 3 + 5) % FIRST_NAMES_MALE.length];
    const guardianName = `${guardianFirst} ${lastName}`;
    const guardianRelation = i % 8 === 0 ? 'Mother' : 'Father';
    const guardianPhone = `+91 98${String(70000000 + i)}`;

    studentsToInsert.push({
      studentId,
      userId,
      rollNumber,
      firstName,
      lastName,
      dateOfBirth: `200${8 - Math.floor((i % 20) / 4)}-05-15`,
      gender: isMale ? 'Male' : 'Female',
      phone: `+91 98${String(10000000 + i)}`,
      email,
      address: `${100 + (i % 500)}, Sector ${1 + (i % 24)}, ${location.city}, ${location.state} - ${location.pincode}`,
      guardianName,
      guardianRelation,
      guardianPhone,
      emergencyContact: guardianPhone,
      courseId: null, // Admin will assign
      batchId: null,  // Admin will assign
      admissionDate: '2026-09-01',
      scholarshipPct: 0.0,
      status: 'ACTIVE',
      totalFee: 0.0,
      paidFee: 0.0,
      pendingFee: 0.0,
    });
  }

  // Fast bulk insert of 1000 users and 1000 students
  await prisma.user.createMany({
    data: usersToInsert,
  });
  console.log(`✔ Bulk created ${TOTAL_STUDENTS} Student User Logins (Password: Student@123).`);

  await prisma.student.createMany({
    data: studentsToInsert,
  });
  console.log(`✔ Bulk created ${TOTAL_STUDENTS} Student Records linked to their respective User accounts.`);

  // 7. Day 1 Welcome Announcement
  await prisma.notification.create({
    data: {
      title: 'Welcome to Academic Session 2026-2027!',
      message: 'All students and faculty members have been registered with their individual accounts. Admin cohort assignment is in progress.',
      type: 'INFORMATION',
      targetRole: 'ALL',
    },
  });

  console.log('\n===============================================================');
  console.log('🎉 1000 Students & 24 Faculty with Individual User Accounts Ready!');
  console.log('Credentials:');
  console.log('👑 Admin: admin@tuition.edu / Admin@123');
  console.log('💼 Accountant: accountant@tuition.edu / Accountant@123');
  console.log('👨‍🏫 Any Faculty: faculty.<firstname>.<lastname>@apexkota.edu.in / Teacher@123 (or username teacher)');
  console.log('🎓 Any Student: student.<firstname>.<lastname><N>@apexkota.edu.in / Student@123 (or username student)');
  console.log('===============================================================');
}

main()
  .catch((e) => {
    console.error('Seed Execution Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
