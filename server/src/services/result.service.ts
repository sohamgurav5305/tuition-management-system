import { resultRepository } from '../repositories/result.repository';
import { examRepository } from '../repositories/exam.repository';
import { studentRepository } from '../repositories/student.repository';
import { calculateGrade } from '../utils/gradeCalculator.util';
import { generateResultId } from '../utils/idGenerator.util';

export class ResultService {
  async getResultsByExam(examId: string) {
    const exam = await examRepository.findById(examId);
    if (!exam) throw new Error('Exam not found');

    const results = await resultRepository.findByExam(examId);
    return {
      exam,
      results,
    };
  }

  async getResultsByStudent(studentId: string) {
    const student = await studentRepository.findById(studentId);
    if (!student) throw new Error('Student not found');

    const results = await resultRepository.findByStudent(studentId);
    return results;
  }

  async submitExamResults(data: {
    examId: string;
    entries: {
      studentId: string;
      marksObtained: number;
      negativePenalty?: number;
      subjectScores?: Record<string, number>;
      remarks?: string;
    }[];
  }) {
    const exam = await examRepository.findById(data.examId);
    if (!exam) throw new Error('Exam not found');

    // Sort entries descending to compute rank & percentile
    const sorted = [...data.entries].sort((a, b) => {
      const netA = Number(a.marksObtained) - Number(a.negativePenalty || 0);
      const netB = Number(b.marksObtained) - Number(b.negativePenalty || 0);
      return netB - netA;
    });

    const totalStudents = sorted.length;
    const savedResults = [];

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const rawMarks = Number(entry.marksObtained);
      const penalty = Number(entry.negativePenalty || 0);
      const netMarks = Math.max(0, rawMarks - penalty);

      if (isNaN(rawMarks) || rawMarks < 0) {
        throw new Error(`Invalid marks (${entry.marksObtained}) for student. Marks must be non-negative.`);
      }

      if (rawMarks > exam.totalMarks) {
        throw new Error(
          `Marks obtained (${rawMarks}) cannot exceed total examination marks (${exam.totalMarks}).`
        );
      }

      const { percentage, grade, isPassed } = calculateGrade(
        netMarks,
        exam.totalMarks,
        exam.passingMarks
      );

      const rank = i + 1;
      const percentile = totalStudents > 1
        ? Number((100 - (i / totalStudents) * 100).toFixed(2))
        : 100.0;

      const resultId = await generateResultId();

      const saved = await resultRepository.upsertResult({
        resultId,
        examId: data.examId,
        studentId: entry.studentId,
        marksObtained: netMarks,
        negativePenalty: penalty,
        percentage,
        percentile,
        batchRank: rank,
        instituteRank: rank,
        grade,
        isPassed,
        subjectScores: entry.subjectScores ? JSON.stringify(entry.subjectScores) : null,
        remarks: entry.remarks || (rank === 1 ? 'Batch Topper' : undefined),
      });

      savedResults.push(saved);
    }

    // Mark exam as COMPLETED once results are submitted
    await examRepository.update(exam.id, { status: 'COMPLETED' });

    return savedResults;
  }
}

export const resultService = new ResultService();
