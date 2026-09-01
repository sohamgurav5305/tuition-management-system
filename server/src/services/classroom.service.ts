import { classroomRepository } from '../repositories/classroom.repository';
import { generateClassroomId } from '../utils/idGenerator.util';
import prisma from '../prisma/client';

const DEFAULT_CLASSROOMS = [
  { name: 'Lecture Hall 101', capacity: 75, roomType: 'LECTURE_HALL', building: 'Academic Block A - Floor 1', facilities: 'Dual 4K Projector, Central AC, Surround Sound, Tiered Seating', status: 'AVAILABLE' },
  { name: 'Lecture Hall 102', capacity: 75, roomType: 'LECTURE_HALL', building: 'Academic Block A - Floor 1', facilities: 'Smart Interactive Board, AC, HD Recording Cameras', status: 'AVAILABLE' },
  { name: 'Smart Classroom A', capacity: 45, roomType: 'SMART_CLASS', building: 'Academic Block B - Floor 2', facilities: 'Interactive Digital Whiteboard, Ergonomic Desks, High-Speed WiFi', status: 'AVAILABLE' },
  { name: 'Smart Classroom B', capacity: 45, roomType: 'SMART_CLASS', building: 'Academic Block B - Floor 2', facilities: 'Smart Touch Display, AC, Video Conferencing Rig', status: 'AVAILABLE' },
  { name: 'Main Auditorium', capacity: 250, roomType: 'AUDITORIUM', building: 'Central Block - Ground Floor', facilities: 'Full Stage, Audio Visual Console, Acoustic Wall Panels, Central AC', status: 'AVAILABLE' },
  { name: 'Physics Lab 1', capacity: 40, roomType: 'SCIENCE_LAB', building: 'Science Wing - Floor 3', facilities: 'Optical Benches, Vernier Sensors, Electrical Testing Kits, Safety Stations', status: 'AVAILABLE' },
  { name: 'Chemistry Lab 1', capacity: 40, roomType: 'SCIENCE_LAB', building: 'Science Wing - Floor 3', facilities: 'Fume Hoods, Analytical Balances, Titration Rigs, Chemical Safety Showers', status: 'AVAILABLE' },
  { name: 'Computer Lab 2', capacity: 50, roomType: 'COMPUTER_LAB', building: 'Technology Wing - Floor 2', facilities: 'Core i7 Workstations, Dual Monitors, Gigabit LAN, UPS Backup', status: 'AVAILABLE' },
];

export class ClassroomService {
  private async autoSeedIfEmpty() {
    const count = await classroomRepository.count();
    if (count === 0) {
      for (const item of DEFAULT_CLASSROOMS) {
        const roomId = await generateClassroomId();
        await classroomRepository.create({
          roomId,
          ...item,
        });
      }
    }
  }

  async getAllClassrooms(status?: string) {
    await this.autoSeedIfEmpty();
    const classrooms = await classroomRepository.findAll(status);
    
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

  async createClassroom(data: any) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Classroom / Venue name is required');
    }

    const trimmedName = data.name.trim();
    const existing = await classroomRepository.findByName(trimmedName);
    if (existing) {
      throw new Error(`A classroom with name '${trimmedName}' already exists.`);
    }

    const roomId = await generateClassroomId();
    const capacity = Number(data.capacity || 60);

    return classroomRepository.create({
      roomId,
      name: trimmedName,
      capacity: capacity > 0 ? capacity : 60,
      roomType: data.roomType || 'LECTURE_HALL',
      building: data.building || 'Main Campus',
      facilities: data.facilities || 'Projector, AC, Smart Board',
      status: data.status || 'AVAILABLE',
    });
  }

  async updateClassroom(id: string, data: any) {
    const existing = await classroomRepository.findById(id);
    if (!existing) throw new Error('Classroom not found');

    if (data.name && data.name.trim() !== existing.name) {
      const duplicate = await classroomRepository.findByName(data.name.trim());
      if (duplicate) {
        throw new Error(`Another classroom with name '${data.name.trim()}' already exists.`);
      }
    }

    const capacity = data.capacity !== undefined ? Number(data.capacity) : existing.capacity;

    return classroomRepository.update(id, {
      name: data.name ? data.name.trim() : existing.name,
      capacity: capacity > 0 ? capacity : existing.capacity,
      roomType: data.roomType ?? existing.roomType,
      building: data.building ?? existing.building,
      facilities: data.facilities ?? existing.facilities,
      status: data.status ?? existing.status,
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
