import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import { logAction } from '../utils/auditLogger';
import { NotFoundError } from '../utils/errors';
import fs from 'fs';
import path from 'path';

export class ProjectController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let whereClause: any = {};

      // If user is a staff, only show projects where they are assigned as PIC
      if (req.user?.managerId) {
        whereClause = {
          OR: [
            { penawaranPicId: req.user.id },
            { boqPicId: req.user.id },
            { rfqPicId: req.user.id },
            { spkPicId: req.user.id },
            { progressPicId: req.user.id },
            { invoicePicId: req.user.id }
          ]
        };
      }

      const projects = await prisma.project.findMany({
        where: whereClause,
        orderBy: { sequence: 'asc' },
        include: { jobs: { orderBy: { createdAt: 'asc' } } }
      });
      res.status(200).json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, description, code, progress, startDate, endDate, remarks, client } = req.body;
      
      // Auto-sequence name if duplicates exist
      let baseName = name.trim();
      let finalName = baseName;
      const existingSameName = await prisma.project.findMany({
        where: { name: { startsWith: baseName } }
      });
      if (existingSameName.length > 0) {
        let maxNum = 0;
        let hasExact = false;
        existingSameName.forEach(p => {
          const escapedName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`^${escapedName}(?: (\\d+))?$`);
          const match = p.name.match(regex);
          if (match) {
            if (match[1]) {
              maxNum = Math.max(maxNum, parseInt(match[1], 10));
            } else {
              hasExact = true;
            }
          }
        });
        if (hasExact || maxNum > 0) {
          finalName = `${baseName} ${Math.max(1, maxNum) + 1}`;
        }
      }

      // Calculate consecutive sequence number based on active projects (e.g. 001, 002, 003...)
      const allProjects = await prisma.project.findMany({ select: { id: true, code: true, sequence: true } });
      let maxSequential = 0;

      allProjects.forEach((p) => {
        if (p.code) {
          const match = p.code.trim().match(/^(\d+)/);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num < 500 && num > maxSequential) {
              maxSequential = num;
            }
          }
        }
      });

      const nextSeqNum = maxSequential > 0 ? maxSequential + 1 : (allProjects.length + 1);
      const nextSeqStr = String(nextSeqNum).padStart(3, '0');

      let project = await prisma.project.create({
        data: { 
          name: finalName, 
          description,
          code: code || '',
          sequence: nextSeqNum,
          progress: progress ? parseInt(progress.toString(), 10) : 0,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          remarks: remarks || ''
        },
      });

      let generatedCode = code;

      // Build 3-digit formatted sequential project code (e.g. 009 - MJK - AFI1)
      if (!code || !code.includes(' - ')) {
        const masterNum = await (prisma as any).masterNumbering.findFirst({
          where: {
            OR: [
              { code: nextSeqStr },
              { code: String(nextSeqNum) },
              { code: code || '' }
            ]
          }
        });

        if (masterNum) {
          generatedCode = masterNum.name;
        } else {
          const companyPrefix = (code && code.trim()) ? code.trim() : 'MJK';
          const acronym = client ? client.toUpperCase() : baseName.toUpperCase();
          generatedCode = `${nextSeqStr} - ${companyPrefix} - ${acronym}`;
        }
      }
      
      project = await prisma.project.update({
        where: { id: project.id },
        data: { code: generatedCode }
      });

      await logAction({
        userId: req.user?.id,
        actionType: 'CREATE_PROJECT',
        tableName: 'projects',
        recordId: project.id,
        description: `Proyek '${finalName}' (${generatedCode}) berhasil didaftarkan`,
        newValues: project,
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { 
        name, description, code, progress, startDate, endDate, remarks, client,
        penawaranPicId, penawaranDueDate,
        boqPicId, boqDueDate,
        rfqPicId, rfqDueDate,
        spkPicId, spkDueDate,
        progressPicId, progressDueDate,
        invoicePicId, invoiceDueDate,
        jobs
      } = req.body;

      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Proyek tidak ditemukan');

      let finalCode = existing.code;
      if (code !== undefined && code !== null && String(code).trim() !== '') {
        finalCode = String(code).trim();
      }

      let newSequence = existing.sequence;
      if (finalCode) {
        const match = finalCode.trim().match(/^(\d+)/);
        if (match && match[1]) {
          const parsedSeq = parseInt(match[1], 10);
          if (!isNaN(parsedSeq)) {
            newSequence = parsedSeq;
          }
        }
      }

      let finalRemarks = remarks !== undefined ? remarks : existing.remarks;
      if (finalCode !== existing.code && finalRemarks) {
        try {
          const parsed = JSON.parse(finalRemarks);
          parsed.projectCode = finalCode;
          if (Array.isArray(parsed.procurementTrackingList)) {
            parsed.procurementTrackingList = parsed.procurementTrackingList.map((item: any) => ({
              ...item,
              projectCode: finalCode
            }));
          }
          finalRemarks = JSON.stringify(parsed);
        } catch (e) {}
      }

      const project = await prisma.project.update({
        where: { id },
        data: {
          name: name !== undefined ? name : existing.name,
          description: description !== undefined ? description : existing.description,
          code: finalCode,
          sequence: newSequence,
          progress: progress !== undefined ? parseInt(progress.toString(), 10) : existing.progress,
          startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
          remarks: finalRemarks,
          
          penawaranPicId: penawaranPicId !== undefined ? penawaranPicId : existing.penawaranPicId,
          penawaranDueDate: penawaranDueDate !== undefined ? (penawaranDueDate ? new Date(penawaranDueDate) : null) : existing.penawaranDueDate,
          
          boqPicId: boqPicId !== undefined ? boqPicId : existing.boqPicId,
          boqDueDate: boqDueDate !== undefined ? (boqDueDate ? new Date(boqDueDate) : null) : existing.boqDueDate,
          
          rfqPicId: rfqPicId !== undefined ? rfqPicId : existing.rfqPicId,
          rfqDueDate: rfqDueDate !== undefined ? (rfqDueDate ? new Date(rfqDueDate) : null) : existing.rfqDueDate,
          
          spkPicId: spkPicId !== undefined ? spkPicId : existing.spkPicId,
          spkDueDate: spkDueDate !== undefined ? (spkDueDate ? new Date(spkDueDate) : null) : existing.spkDueDate,
          
          progressPicId: progressPicId !== undefined ? progressPicId : existing.progressPicId,
          progressDueDate: progressDueDate !== undefined ? (progressDueDate ? new Date(progressDueDate) : null) : existing.progressDueDate,
          
          invoicePicId: invoicePicId !== undefined ? invoicePicId : existing.invoicePicId,
          invoiceDueDate: invoiceDueDate !== undefined ? (invoiceDueDate ? new Date(invoiceDueDate) : null) : existing.invoiceDueDate,
        },
      });

      if (jobs && Array.isArray(jobs)) {
        const jobIds = jobs.filter((j: any) => j.id && typeof j.id === 'string' && j.id.trim() !== '').map((j: any) => j.id);
        
        await prisma.projectJob.deleteMany({
          where: {
            projectId: id,
            id: { notIn: jobIds }
          }
        });

        for (const job of jobs) {
          if (job.id && typeof job.id === 'string' && job.id.trim() !== '') {
            await prisma.projectJob.update({
              where: { id: job.id },
              data: {
                uraianPekerjaan: job.uraianPekerjaan,
                rfqDate: job.rfqDate,
                progress: job.progress,
                subkon1Nama: job.subkon1Nama,
                subkon1Status: job.subkon1Status,
                subkon2Nama: job.subkon2Nama,
                subkon2Status: job.subkon2Status,
                subkon3Nama: job.subkon3Nama,
                subkon3Status: job.subkon3Status,
                remarks: job.remarks
              }
            });
          } else {
            await prisma.projectJob.create({
              data: {
                projectId: id,
                uraianPekerjaan: job.uraianPekerjaan,
                rfqDate: job.rfqDate,
                progress: job.progress,
                subkon1Nama: job.subkon1Nama,
                subkon1Status: job.subkon1Status,
                subkon2Nama: job.subkon2Nama,
                subkon2Status: job.subkon2Status,
                subkon3Nama: job.subkon3Nama,
                subkon3Status: job.subkon3Status,
                remarks: job.remarks
              }
            });
          }
        }
      }

      await logAction({
        userId: req.user?.id,
        actionType: 'UPDATE_PROJECT',
        tableName: 'projects',
        recordId: project.id,
        description: `Proyek '${name}' (${code || '-'}) berhasil diperbarui`,
        oldValues: existing,
        newValues: project,
        ipAddress: req.ip,
      });

      const finalProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: { jobs: true }
      });

      res.status(200).json({ success: true, data: finalProject });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Proyek tidak ditemukan');

      await prisma.project.delete({ where: { id } });

      await logAction({
        userId: req.user?.id,
        actionType: 'DELETE_PROJECT',
        tableName: 'projects',
        recordId: id,
        description: `Proyek '${existing.name}' berhasil dihapus`,
        oldValues: existing,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, message: 'Proyek berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }

  static async getDataTxtLines(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dataPath = path.join(process.cwd(), '../data.txt');
      let lines: string[] = [];
      if (fs.existsSync(dataPath)) {
        const content = fs.readFileSync(dataPath, 'utf8');
        lines = content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .slice(0, 10);
      }
      res.status(200).json({ success: true, data: lines });
    } catch (error) {
      next(error);
    }
  }
}
