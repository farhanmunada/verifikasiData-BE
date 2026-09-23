import { rmPasienRepository } from '../repositories/rmpasien.repository';

export class ValidationService {
  async getDashboardStats() {
    return await rmPasienRepository.getDashboardStats();
  }

  async getDuplicateCandidates() {
    const candidateGroups = await rmPasienRepository.findDuplicateCandidates();
    return candidateGroups;
  }

  async checkIdentity(identityNumber: string) {
    if (!identityNumber) {
      throw { statusCode: 400, message: 'Nomor identitas BPJS wajib diisi.', code: 'VALIDATION_ERROR' };
    }

    if (identityNumber === 'XXX') {
      return {
        no_identitas: 'XXX',
        is_duplicate: false,
        message: 'Nomor identitas XXX merupakan penanda data yang telah dicleansing.',
        registrations: [],
      };
    }

    const records = await rmPasienRepository.findByIdentityNumber(identityNumber);
    const uniqueRM = new Set(records.map((r: any) => r.vc_no_rm));
    const isDuplicate = uniqueRM.size > 1;

    return {
      no_identitas: identityNumber,
      total_records: records.length,
      total_rm: uniqueRM.size,
      is_duplicate: isDuplicate,
      records: records,
    };
  }

  async cleanDuplicate(vc_no_rm: string) {
    const record = await rmPasienRepository.findByRm(vc_no_rm);
    if (!record) {
      throw { statusCode: 404, message: 'Data pasien tidak ditemukan.', code: 'NOT_FOUND' };
    }

    await rmPasienRepository.updateIdentity(vc_no_rm, 'XXX');

    return {
      vc_no_rm,
      old_identity: record.vc_no_peserta_bpjs,
      status: 'CLEANED'
    };
  }
}

export const validationService = new ValidationService();
