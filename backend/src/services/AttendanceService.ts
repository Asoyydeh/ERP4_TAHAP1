import prisma from '../config/db';
import { BadRequestError } from '../utils/errors';

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
}

const TARGET_LAT = -6.2693909783439725;
const TARGET_LNG = 106.59651779135899;
const MAX_RADIUS_METERS = 10;

export class AttendanceService {
  private static validateLocation(role: string, lat?: number, lng?: number) {
    // Dimatikan sementara sesuai permintaan
    return;
    /*
    const restrictedRoles = ['FINANCE', 'PROCUREMENT', 'PROYEK_ADMIN', 'ENGINEERING', 'HRD'];
    if (restrictedRoles.includes(role)) {
      if (!lat || !lng) {
        throw new BadRequestError('Akses lokasi diperlukan untuk melakukan absensi pada role Anda.');
      }
      const distance = getDistanceFromLatLonInM(lat, lng, TARGET_LAT, TARGET_LNG);
      if (distance > MAX_RADIUS_METERS) {
        throw new BadRequestError(`Anda berada di luar jangkauan area absensi (${Math.round(distance)} meter dari target). Silakan mendekat ke lokasi proyek.`);
      }
    }
    */
  }

  static async checkIn(user: any, status: string = 'HADIR', notes?: string, photoUrl?: string, lat?: number, lng?: number) {
    if (status === 'HADIR') {
      this.validateLocation(user.role, lat, lng);
    } else {
      if (!notes) throw new BadRequestError('Keterangan wajib diisi untuk status Izin/Sakit/Tidak Hadir');
      if (!photoUrl) throw new BadRequestError('Bukti foto wajib dilampirkan untuk status Izin/Sakit/Tidak Hadir');
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: today
      }
    });

    if (existing) {
      throw new BadRequestError('Anda sudah melakukan absensi hari ini');
    }

    return prisma.attendance.create({
      data: {
        userId: user.id,
        date: today,
        checkIn: new Date(),
        status,
        notes,
        photoUrl
      }
    });
  }

  static async checkOut(user: any, lat?: number, lng?: number) {
    this.validateLocation(user.role, lat, lng);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: today
      }
    });

    if (!existing) {
      throw new BadRequestError('Anda belum melakukan check-in hari ini');
    }

    if (existing.checkOut) {
      throw new BadRequestError('Anda sudah melakukan check-out hari ini');
    }

    return prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: new Date()
      }
    });
  }

  static async getMyAttendance(userId: string) {
    return prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
  }

  static async getAllAttendance() {
    return prisma.attendance.findMany({
      include: {
        user: {
          select: { name: true, role: true, email: true, photoUrl: true }
        }
      },
      orderBy: { date: 'desc' }
    });
  }
}
