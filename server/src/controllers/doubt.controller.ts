import { Request, Response } from 'express';
import { doubtService } from '../services/doubt.service';
import prisma from '../prisma/client';
import { resolveFacultyId, resolveStudentId } from '../utils/userResolver';

export class DoubtController {
  async getBatchFaculty(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role !== 'STUDENT') {
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

      const studentId = await resolveStudentId(req.user);
      if (!studentId) {
        res.status(400).json({ success: false, message: 'Student profile not linked to user account' });
        return;
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          batch: {
            include: {
              faculty: true,
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
        } catch {
          // JSON parse fallback
        }
      }

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

      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req.user);
        if (!myStudentId) {
          res.json({ success: true, data: [] });
          return;
        }
        targetStudentId = myStudentId;
      }

      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req.user);
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

      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req.user);
        if (!myStudentId || doubt.studentId !== myStudentId) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You are only permitted to view your own 1-on-1 doubts.',
          });
          return;
        }
      }

      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req.user);
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

      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req.user);
        if (!myStudentId) {
          res.status(400).json({ success: false, message: 'Student profile not linked to account' });
          return;
        }
        data.studentId = myStudentId;
      }

      const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      const doubt = await doubtService.createDoubt(data, files);
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
        const myFacultyId = await resolveFacultyId(req.user);
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

      const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      const doubt = await doubtService.answerDoubt(
        req.params.id,
        facultyIdToUse,
        req.body.answerText || req.body.answer || '',
        files
      );

      res.json({
        success: true,
        data: doubt,
        message: '1-on-1 mentorship solution recorded and sent to student',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const doubt = await doubtService.getDoubtById(req.params.id);

      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req.user);
        if (doubt.studentId !== myStudentId) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You cannot delete another student’s doubt.',
          });
          return;
        }
      }

      await doubtService.deleteDoubt(req.params.id);
      res.json({ success: true, message: 'Doubt thread deleted' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const doubtController = new DoubtController();
