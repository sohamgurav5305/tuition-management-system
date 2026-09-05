export type UserRole = 'ADMINISTRATOR' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT';

export interface SystemSettings {
  instituteName?: string;
  instituteAddress?: string;
  institutePhone?: string;
  instituteEmail?: string;
  currencySymbol?: string;
  taxRate?: string;
  systemTheme?: string;
  [key: string]: string | undefined;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  status: string;
  createdAt: string;
  faculty?: Faculty;
  student?: Student;
}



export interface Classroom {
  id: string;
  roomId: string;
  name: string;
  floor: string;
  createdAt: string;
  activeBatchesCount?: number;
  assignedBatches?: any[];
}

export interface Course {
  id: string;
  courseId: string;
  name: string;
  targetExam: string;
  gradeLevel: string;
  description: string;
  duration: string;
  fee: number;
  subjects?: string | null;
  status: string;
  createdAt: string;
  batches?: Batch[];
  students?: Student[];
  _count?: {
    batches: number;
    students: number;
  };
}

export interface Faculty {
  id: string;
  facultyId: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  subjectTaught: string;
  qualification: string;
  experienceYears: number;
  joiningDate: string;
  salary: number;
  status: string;
  avatarUrl?: string | null;
  batchCount?: number;
  createdAt: string;
  batches?: Batch[];
  user?: User;
  _count?: {
    batches: number;
  };
}

export interface SubjectInstructor {
  subject: string;
  facultyId: string;
  facultyName: string;
  subjectTaught: string;
  phone?: string;
  email?: string;
}

export interface Batch {
  id: string;
  batchId: string;
  name: string;
  courseId: string;
  facultyId: string;
  subjectTeachers?: string | null;
  subjectInstructors?: SubjectInstructor[];
  classroom: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string; // JSON array string
  syllabusPct: number;
  status: string;
  createdAt: string;
  course?: Course;
  faculty?: Faculty;
  students?: Student[];
  _count?: {
    students: number;
    attendance?: number;
  };
}

export interface FeeInstallment {
  id: string;
  studentId: string;
  installmentNo: number;
  title: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidDate?: string | null;
  paidAmount: number;
}

export interface Student {
  id: string;
  studentId: string;
  rollNumber?: string | null;
  userId?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  emergencyContact: string;
  courseId: string;
  batchId?: string | null;
  admissionDate: string;
  scholarshipPct: number;
  status: string;
  avatarUrl?: string | null;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  createdAt: string;
  course?: Course;
  batch?: Batch | null;
  user?: User;
  attendanceStats?: {
    total: number;
    present: number;
    absent: number;
    percentage: number;
    subjects?: {
      [subj: string]: {
        total: number;
        present: number;
        absent: number;
        percentage: number;
        facultyName?: string;
      };
    };
  };
  attendancePercentage?: number;
  installments?: FeeInstallment[];
  payments?: Payment[];
  results?: Result[];
  attendance?: Attendance[];
}

export interface Attendance {
  id: string;
  batchId: string;
  studentId: string;
  subject: string;
  facultyId?: string | null;
  date: string;
  status: 'PRESENT' | 'ABSENT';
  remarks?: string | null;
  markedById?: string | null;
  createdAt: string;
  student?: Student;
  batch?: Batch;
  faculty?: Faculty;
}


export interface LeaveRequest {
  id: string;
  studentId?: string | null;
  facultyId?: string | null;
  applicantType?: 'STUDENT' | 'FACULTY';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string | null;
  createdAt: string;
  student?: Student;
  faculty?: Faculty;
}

export interface Examination {
  id: string;
  examId: string;
  title: string;
  examPattern: string;
  examDate: string;
  courseId: string;
  batchId: string;
  subject: string;
  totalMarks: number;
  passingMarks: number;
  correctMarks: number;
  negativeMarks: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  createdAt: string;
  course?: Course;
  batch?: Batch;
  results?: Result[];
  _count?: {
    results: number;
  };
}

export interface Result {
  id: string;
  resultId: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  negativePenalty: number;
  percentage: number;
  percentile: number;
  batchRank: number;
  instituteRank: number;
  grade: string;
  isPassed: boolean;
  subjectScores?: string | null;
  remarks?: string | null;
  createdAt: string;
  student?: Student;
  exam?: Examination;
}

export interface StudyMaterial {
  id: string;
  materialId: string;
  title: string;
  materialType: 'DPP' | 'CLASS_NOTES' | 'FORMULA_SHEET' | 'QUESTION_BANK' | 'TEST_SOLUTION';
  subject: string;
  chapterName: string;
  courseId?: string | null;
  batchId?: string | null;
  fileUrl?: string | null;
  fileUrls?: string | null;
  files?: string[];
  downloadCount: number;
  createdAt: string;
  course?: Course;
  batch?: Batch;
}

export interface Doubt {
  id: string;
  doubtId: string;
  studentId: string;
  facultyId?: string | null;
  subject: string;
  topic: string;
  questionText: string;
  attachmentUrl?: string | null;
  attachments?: string[];
  answerText?: string | null;
  answerAttachmentUrl?: string | null;
  answerAttachments?: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  answeredAt?: string | null;
  createdAt: string;
  student?: Student;
  faculty?: Faculty;
}

export interface LectureLog {
  id: string;
  batchId: string;
  facultyId: string;
  date: string;
  subject: string;
  chapterCovered: string;
  topicsDetails: string;
  dppAssigned?: string | null;
  durationMins: number;
  createdAt: string;
  batch?: Batch;
  faculty?: Faculty;
}

export interface AssignmentSubmission {
  id: string;
  submissionId: string;
  assignmentId: string;
  studentId: string;
  fileUrl?: string | null;
  fileUrls?: string | null;
  files?: string[];
  submissionText?: string | null;
  submittedAt: string;
  isLate: boolean;
  timingText?: string | null;
  status: 'SUBMITTED' | 'GRADED';
  score?: number | null;
  feedback?: string | null;
  gradedById?: string | null;
  gradedAt?: string | null;
  createdAt: string;
  student?: Student;
  assignment?: Assignment;
}

export interface Assignment {
  id: string;
  assignmentId: string;
  title: string;
  description: string;
  subject: string;
  batchId: string;
  facultyId?: string;
  dueDate: string;
  totalMarks: number;
  status: 'OPEN' | 'CLOSED';
  attachmentUrl?: string | null;
  fileUrls?: string | null;
  attachments?: string[];
  createdAt: string;
  batch?: Batch;
  faculty?: Faculty;
  mySubmission?: AssignmentSubmission | null;
  totalSubmissions?: number;
  gradedSubmissions?: number;
}

export interface Payment {
  id: string;
  receiptId: string;
  studentId: string;
  amount: number;
  taxAmount: number;
  paymentDate: string;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE_GATEWAY';
  transactionReference?: string | null;
  remarks?: string | null;
  recordedById?: string | null;
  createdAt: string;
  student?: Student;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'INFORMATION' | 'SUCCESS' | 'URGENT' | 'EXAM' | 'FEE';
  targetRole: string;
  targetUserId?: string | null;
  attachmentUrl?: string | null;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

export interface TimetableSlot {
  id: string;
  batchId: string;
  batchName: string;
  courseName: string;
  facultyName: string;
  subjectTaught: string;
  classroom: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  syllabusPct?: number;
  studentCount: number;
}
