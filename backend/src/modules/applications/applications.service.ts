import prisma from '../../config/database';
import { Prisma, ApplicationStatus } from '@prisma/client';

export const createApplication = async (applicantId: string, data: Partial<Prisma.LandApplicationCreateInput>) => {
  // Strip out status, applicant_id, or timestamps if they were passed
  const { status, applicant_id, applicant, created_at, updated_at, ...safeData } = data as any;

  return prisma.$transaction(async (tx) => {
    const newApplication = await tx.landApplication.create({
      data: {
        ...safeData,
        status: ApplicationStatus.DRAFT,
        applicant: {
          connect: { user_id: applicantId }
        }
      }
    });

    await tx.assetEvent.create({
      data: {
        application_id: newApplication.application_id,
        asset_id: null,
        event_type: 'APPLICATION_CREATED',
        performed_by: applicantId,
        metadata: {
          land_id: newApplication.land_id,
          survey_no: newApplication.survey_no,
          asset_type: newApplication.asset_type
        }
      }
    });

    return newApplication;
  });
};

export const getApplicationsByApplicant = async (applicantId: string) => {
  return prisma.landApplication.findMany({
    where: { applicant_id: applicantId },
    orderBy: { created_at: 'desc' }
  });
};

export const getVerificationQueueApplications = async () => {
  return prisma.landApplication.findMany({
    where: {
      status: {
        in: [
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.CORRECTION_REQUIRED,
          ApplicationStatus.VERIFIED
        ]
      }
    },
    orderBy: { updated_at: 'desc' },
    select: {
      application_id: true,
      survey_no: true,
      owner_name: true,
      area: true,
      latitude: true,
      longitude: true,
      asset_type: true,
      description: true,
      status: true,
      created_at: true,
      updated_at: true,
      applicant: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
};

export const getApprovalQueueApplications = async () => {
  return prisma.landApplication.findMany({
    where: {
      status: ApplicationStatus.PENDING_APPROVAL
    },
    orderBy: { updated_at: 'desc' },
    select: {
      application_id: true,
      survey_no: true,
      owner_name: true,
      area: true,
      latitude: true,
      longitude: true,
      asset_type: true,
      description: true,
      status: true,
      created_at: true,
      updated_at: true,
      applicant: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
};

export const getAllApplications = async () => {
  return prisma.landApplication.findMany({
    orderBy: { updated_at: 'desc' },
    select: {
      application_id: true,
      survey_no: true,
      owner_name: true,
      area: true,
      latitude: true,
      longitude: true,
      asset_type: true,
      description: true,
      status: true,
      created_at: true,
      updated_at: true,
      applicant: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
};

export const getApplicationById = async (applicationId: string) => {
  return prisma.landApplication.findUnique({
    where: { application_id: applicationId },
    include: {
      events: {
        orderBy: { created_at: 'desc' }
      },
      documents: {
        orderBy: { uploaded_at: 'desc' }
      },
      workflow: {
        orderBy: { action_time: 'desc' }
      }
    }
  });
};

export const updateApplication = async (applicationId: string, data: Partial<Prisma.LandApplicationUpdateInput>) => {
  // Prevent updating protected fields
  const { status, applicant_id, applicant, created_at, updated_at, ...safeData } = data as any;

  return prisma.landApplication.update({
    where: { application_id: applicationId },
    data: safeData
  });
};
