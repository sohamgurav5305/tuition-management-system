import { Request, Response } from 'express';
import { doubtService } from '../services/doubt.service';
import prisma from '../prisma/client';

async function resolveStudentId(req: Request): Promise<string | null> {
  if (req.user?.studentId) return req.user.studentId;
  if (!req.user) return null;
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { userId: req.user.id },
        { email: req.user.email },
        { id: req.user.id },
      ],
    },
  });
  return student?.id || null;
}

async function resolveFacultyId(req: Request): Promise<string | null> {
  if (!req.user) return null;
  const faculty = await prisma.faculty.findFirst({
    where: {
      OR: [
        { userId: req.user.id },
        { email: req.user.email },
        { id: req.user.id },
      ],
    },
  });
  return faculty?.id || null;
}

export class DoubtController {
  async getBatchFaculty(req: Request, res: Response): Promise<void> {
    try {
      const studentId = await resolveStudentId(req);
      if (!studentId) {
        const faculties = await prisma.faculty.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            facultyId: true,
            firstName: true,
            lastName: true,
            subjectTaught: true,
            qualification: true,
            avatarUrl: true,
          },
        });
        res.json({ success: true, data: faculties });
        return;
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          batch: {
            include: {
              faculty: true,
              course: true,
            },
          },
        },
      });

      if (!student || !student.batch) {
        const faculties = await prisma.faculty.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            facultyId: true,
            firstName: true,
            lastName: true,
            subjectTaught: true,
            qualification: true,
            avatarUrl: true,
          },
        });
        res.json({ success: true, data: faculties });
        return;
      }

      const facultyList: any[] = [];
      const seenIds = new Set<string>();

      // 1. Primary Batch Coordinator / Faculty
      if (student.batch.faculty) {
        seenIds.add(student.batch.faculty.id);
        facultyList.push({
          id: student.batch.faculty.id,
          facultyId: student.batch.faculty.facultyId,
          firstName: student.batch.faculty.firstName,
          lastName: student.batch.faculty.lastName,
          subjectTaught: student.batch.faculty.subjectTaught,
          qualification: student.batch.faculty.qualification,
          avatarUrl: student.batch.faculty.avatarUrl,
          isLead: true,
        });
      }

      // 2. Subject Specialist Teachers mapped on this batch
      if (student.batch.subjectTeachers) {
        try {
          const mapping = JSON.parse(student.batch.subjectTeachers);
          for (const [subjectName, facId] of Object.entries(mapping)) {
            if (typeof facId === 'string' && !seenIds.has(facId)) {
              const fac = await prisma.faculty.findUnique({ where: { id: facId } });
              if (fac) {
                seenIds.add(fac.id);
                facultyList.push({
                  id: fac.id,
                  facultyId: fac.facultyId,
                  firstName: fac.firstName,
                  lastName: fac.lastName,
                  subjectTaught: subjectName || fac.subjectTaught,
                  qualification: fac.qualification,
                  avatarUrl: fac.avatarUrl,
                  isLead: false,
                });
              }
            }
          }
        } catch (e) {
          // JSON parse fallback
        }
      }

      // Fallback if empty
      if (facultyList.length === 0) {
        const all = await prisma.faculty.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            facultyId: true,
            firstName: true,
            lastName: true,
            subjectTaught: true,
            qualification: true,
            avatarUrl: true,
          },
        });
        res.json({ success: true, data: all });
        return;
      }

      res.json({ success: true, data: facultyList });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, facultyId, status, subject } = req.query;
      let targetStudentId = studentId as string | undefined;
      let targetFacultyId = facultyId as string | undefined;

      // Student Privacy: A student can ONLY see their own 1-on-1 doubts
      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req);
        if (!myStudentId) {
          res.json({ success: true, data: [] });
          return;
        }
        targetStudentId = myStudentId;
      }

      // Faculty Privacy: A teacher can ONLY see doubts assigned directly to them
      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req);
        if (!myFacultyId) {
          res.json({ success: true, data: [] });
          return;
        }
        targetFacultyId = myFacultyId;
      }

      const doubts = await doubtService.getAllDoubts({
        studentId: targetStudentId,
        facultyId: targetFacultyId,
        status: status as string,
        subject: subject as string,
      });
      res.json({ success: true, data: doubts });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const doubt = await doubtService.getDoubtById(req.params.id);

      // Student Access Check
      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req);
        if (!myStudentId || doubt.studentId !== myStudentId) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You are only permitted to view your own 1-on-1 doubts.',
          });
          return;
        }
      }

      // Faculty Access Check: A teacher can only view doubts directed to them
      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req);
        if (!myFacultyId || (doubt.facultyId && doubt.facultyId !== myFacultyId)) {
          res.status(403).json({
            success: false,
            message: 'Access denied: This doubt was addressed to a different faculty specialist.',
          });
          return;
        }
      }

      res.json({ success: true, data: doubt });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      let data = { ...req.body };

      if (!data.facultyId) {
        res.status(400).json({
          success: false,
          message: 'Please choose a faculty specialist mentor from your batch.',
        });
        return;
      }

      // Ensure studentId is bound to authenticated student
      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req);
        if (!myStudentId) {
          res.status(400).json({ success: false, message: 'Student profile not linked to account' });
          return;
        }
        data.studentId = myStudentId;
      }

      const doubt = await doubtService.createDoubt(data);
      res.status(201).json({
        success: true,
        data: doubt,
        message: '1-on-1 doubt submitted directly to chosen faculty specialist',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async answer(req: Request, res: Response): Promise<void> {
    try {
      let facultyIdToUse = req.body.facultyId;

      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req);
        if (!myFacultyId) {
          res.status(400).json({ success: false, message: 'Faculty profile not linked to account' });
          return;
        }

        const doubt = await doubtService.getDoubtById(req.params.id);
        if (doubt.facultyId && doubt.facultyId !== myFacultyId) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You can only resolve doubts submitted directly to you.',
          });
          return;
        }
        facultyIdToUse = myFacultyId;
      }

      const doubt = await doubtService.answerDoubt(
        req.params.id,
        facultyIdToUse || req.user?.id,
        req.body.answerText
      );
      res.json({ success: true, data: doubt, message: 'Solution provided and doubt resolved' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req);
        const existing = await doubtService.getDoubtById(req.params.id);
        if (!myStudentId || existing.studentId !== myStudentId) {
          res.status(403).json({
            success: false,
            message: "Access denied: You cannot remove another student's doubt query.",
          });
          return;
        }
      }

      await doubtService.deleteDoubt(req.params.id);
      res.json({ success: true, message: 'Doubt query removed' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const doubtController = new DoubtController();
