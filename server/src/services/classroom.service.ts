import { classroomRepository } from '../repositories/classroom.repository';
import { generateClassroomId } from '../utils/idGenerator.util';
import prisma from '../prisma/client';

const DEFAULT_CLASSROOMS = [
  { name: 'Room 001', floor: 'Ground Floor' },
  { name: 'Room 002', floor: 'Ground Floor' },
  { name: 'Room 003', floor: 'Ground Floor' },
  { name: 'Room 004', floor: 'Ground Floor' },
  { name: 'Room 005', floor: 'Ground Floor' },
  { name: 'Room 006', floor: 'Ground Floor' },
  { name: 'Room 101', floor: 'First Floor' },
  { name: 'Room 102', floor: 'First Floor' },
  { name: 'Room 103', floor: 'First Floor' },
  { name: 'Room 104', floor: 'First Floor' },
  { name: 'Room 105', floor: 'First Floor' },
  { name: 'Room 106', floor: 'First Floor' },
];

export class ClassroomService {
  private async autoSeedIfEmpty() {
    const count = await classroomRepository.count();
    if (count === 0) {
      for (const item of DEFAULT_CLASSROOMS) {
        const roomId = await generateClassroomId();
        await classroomRepository.create({
          roomId,
          name: item.name,
          floor: item.floor,
        });
      }
    }
  }

  async getAllClassrooms() {
    await this.autoSeedIfEmpty();
    const classrooms = await classroomRepository.findAll();
    
    // Enrich with active batches assigned to this room
    const batches = await prisma.batch.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, classroom: true, startTime: true, endTime: true, daysOfWeek: true },
    });

    return classrooms.map((room) => {
      const roomBatches = batches.filter(
        (b) => b.classroom.trim().toLowerCase() === room.name.trim().toLowerCase()
      );
      return {
        ...room,
        activeBatchesCount: roomBatches.length,
        assignedBatches: roomBatches,
      };
    });
  }

  async getClassroomById(id: string) {
    const room = await classroomRepository.findById(id);
    if (!room) throw new Error('Classroom not found');

    const activeBatches = await prisma.batch.findMany({
      where: {
        status: 'ACTIVE',
        classroom: room.name,
      },
    });

    return {
      ...room,
      assignedBatches: activeBatches,
    };
  }

  async createClassroom(data: { name: string; floor?: string }) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Classroom / Venue name is required');
    }

    const trimmedName = data.name.trim();
    const existing = await classroomRepository.findByName(trimmedName);
    if (existing) {
      throw new Error(`A classroom with name '${trimmedName}' already exists.`);
    }

    const roomId = await generateClassroomId();
    const floor = data.floor && data.floor.trim() ? data.floor.trim() : 'Ground Floor';

    return classroomRepository.create({
      roomId,
      name: trimmedName,
      floor,
    });
  }

  async updateClassroom(id: string, data: { name?: string; floor?: string }) {
    const existing = await classroomRepository.findById(id);
    if (!existing) throw new Error('Classroom not found');

    if (data.name && data.name.trim() !== existing.name) {
      const duplicate = await classroomRepository.findByName(data.name.trim());
      if (duplicate) {
        throw new Error(`Another classroom with name '${data.name.trim()}' already exists.`);
      }
    }

    return classroomRepository.update(id, {
      name: data.name ? data.name.trim() : existing.name,
      floor: data.floor ? data.floor.trim() : existing.floor,
    });
  }

  async deleteClassroom(id: string) {
    const existing = await classroomRepository.findById(id);
    if (!existing) throw new Error('Classroom not found');

    // Check if any active batches are assigned to this room
    const activeBatchesCount = await prisma.batch.count({
      where: {
        status: 'ACTIVE',
        classroom: existing.name,
      },
    });

    if (activeBatchesCount > 0) {
      throw new Error(
        `Cannot delete classroom '${existing.name}' because it currently has ${activeBatchesCount} active batch(es) scheduled in it. Reassign batches first.`
      );
    }

    return classroomRepository.delete(id);
  }
}

export const classroomService = new ClassroomService();
