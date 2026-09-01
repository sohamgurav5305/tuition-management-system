export interface GradeResult {
  percentage: number;
  grade: string;
  isPassed: boolean;
}

export function calculateGrade(marksObtained: number, totalMarks: number, passingMarks: number): GradeResult {
  if (totalMarks <= 0) {
    throw new Error('Total marks must be greater than zero');
  }
  if (marksObtained < 0) {
    throw new Error('Marks obtained cannot be negative');
  }
  if (marksObtained > totalMarks) {
    throw new Error(`Marks obtained (${marksObtained}) cannot exceed total marks (${totalMarks})`);
  }

  const percentage = Number(((marksObtained / totalMarks) * 100).toFixed(2));
  let grade = 'D';

  if (percentage >= 90) {
    grade = 'A+';
  } else if (percentage >= 80) {
    grade = 'A';
  } else if (percentage >= 70) {
    grade = 'B+';
  } else if (percentage >= 60) {
    grade = 'B';
  } else if (percentage >= 50) {
    grade = 'C';
  } else {
    grade = 'D';
  }

  const isPassed = marksObtained >= passingMarks;

  return {
    percentage,
    grade,
    isPassed,
  };
}
