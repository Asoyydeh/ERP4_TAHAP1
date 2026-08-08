import { Request, Response } from 'express';
import prisma from '../config/db';

export const getProjectSubkons = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const type = (req.query.type as string) || 'SUBKON1';

    const subkons = await prisma.projectSubkon.findMany({
      where: { projectId, type },
      include: {
        masterSubkon: true,
        termins: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({ success: true, data: subkons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProjectSubkon = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { masterSubkonId, namaPekerjaan, kategori, nilaiKontrak, termins, type = 'SUBKON1' } = req.body;

    const parsedNilaiKontrak = nilaiKontrak ? parseFloat(nilaiKontrak) : null;

    const newSubkon = await prisma.projectSubkon.create({
      data: {
        projectId,
        masterSubkonId: masterSubkonId || null,
        namaPekerjaan,
        kategori,
        nilaiKontrak: parsedNilaiKontrak,
        type,
        termins: {
          create: termins?.map((t: any) => {
            const parseDateSafe = (dateVal: any) => {
              if (!dateVal) return null;
              const d = new Date(dateVal);
              return isNaN(d.getTime()) ? null : d;
            };

            const parseFloatSafe = (val: any) => {
              if (val === undefined || val === null || val === '') return null;
              const str = val.toString().replace(/,/g, '.');
              const parsed = parseFloat(str);
              return isNaN(parsed) ? null : parsed;
            };

            const { id, ...terminData } = t;
            return {
              ...terminData,
              nilaiJasa: parseFloatSafe(t.nilaiJasa),
              pembayaranPersen: typeof t.pembayaranPersen === 'string' ? parseFloatSafe(t.pembayaranPersen.replace('%','')) : (t.pembayaranPersen || null),
              tanggalPengajuan: parseDateSafe(t.tanggalPengajuan),
              tanggalDibayar: parseDateSafe(t.tanggalDibayar),
            };
          }) || []
        }
      },
      include: {
        masterSubkon: true,
        termins: true
      }
    });

    res.status(201).json({ success: true, data: newSubkon, message: 'Data Subkon berhasil ditambahkan' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProjectSubkon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { masterSubkonId, namaPekerjaan, kategori, nilaiKontrak, termins, type } = req.body;

    const parsedNilaiKontrak = nilaiKontrak ? parseFloat(nilaiKontrak) : null;

    // Update parent
    const updateData: any = {
      masterSubkonId: masterSubkonId || null,
      namaPekerjaan,
      kategori,
      nilaiKontrak: parsedNilaiKontrak,
    };
    if (type) updateData.type = type;

    const updatedSubkon = await prisma.projectSubkon.update({
      where: { id },
      data: updateData
    });

    // Handle termins
    if (termins && Array.isArray(termins)) {
      const incomingIds = termins.filter((t: any) => t.id).map((t: any) => t.id);
      
      // Delete termins not in incoming data
      await prisma.projectSubkonTermin.deleteMany({
        where: {
          projectSubkonId: id,
          id: { notIn: incomingIds }
        }
      });

      // Upsert incoming termins
      for (const t of termins) {
        const parseDateSafe = (dateVal: any) => {
          if (!dateVal) return null;
          const d = new Date(dateVal);
          return isNaN(d.getTime()) ? null : d;
        };

        const parseFloatSafe = (val: any) => {
          if (val === undefined || val === null || val === '') return null;
          const str = val.toString().replace(/,/g, '.');
          const parsed = parseFloat(str);
          return isNaN(parsed) ? null : parsed;
        };

        const terminData = {
          ...t,
          id: undefined,
          projectSubkonId: undefined,
          nilaiJasa: parseFloatSafe(t.nilaiJasa),
          pembayaranPersen: typeof t.pembayaranPersen === 'string' ? parseFloatSafe(t.pembayaranPersen.replace('%','')) : (t.pembayaranPersen || null),
          tanggalPengajuan: parseDateSafe(t.tanggalPengajuan),
          tanggalDibayar: parseDateSafe(t.tanggalDibayar),
        };

        if (t.id) {
          await prisma.projectSubkonTermin.update({
            where: { id: t.id },
            data: terminData
          });
        } else {
          await prisma.projectSubkonTermin.create({
            data: {
              ...terminData,
              projectSubkonId: id
            }
          });
        }
      }
    }

    const finalData = await prisma.projectSubkon.findUnique({
      where: { id },
      include: { masterSubkon: true, termins: { orderBy: { createdAt: 'asc' } } }
    });

    res.status(200).json({ success: true, data: finalData, message: 'Data Subkon berhasil diupdate' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProjectSubkon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.projectSubkon.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: 'Data Subkon berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
