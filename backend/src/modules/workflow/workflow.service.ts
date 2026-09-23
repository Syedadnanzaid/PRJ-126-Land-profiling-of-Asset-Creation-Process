import { PrismaClient, ApplicationStatus, EventType } from '@prisma/client';

const prisma = new PrismaClient();

export const processTransition = async (
  applicationId: string,
  userId: string,
  expectedStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  eventType: EventType,
  remarks?: string
) => {
  return await prisma.$transaction(async (tx) => {
    const application = await tx.landApplication.findUnique({
      where: { application_id: applicationId }
    });

    if (!application) {
      throw new Error('Land application not found');
    }

    if (application.status !== expectedStatus) {
      throw new Error(`Invalid state transition. Application is in ${application.status} state, expected ${expectedStatus}`);
    }

    // Update the application status
    const updatedApplication = await tx.landApplication.update({
      where: { application_id: applicationId },
      data: { status: newStatus }
    });

    // Create workflow history record
    const history = await tx.workflowHistory.create({
      data: {
        application_id: applicationId,
        previous_status: expectedStatus,
        new_status: newStatus,
        action_by: userId,
        remarks: remarks || null
      }
    });

    // Create asset event for the transition
    await tx.assetEvent.create({
      data: {
        application_id: applicationId,
        asset_id: null,
        event_type: eventType,
        performed_by: userId,
        metadata: {
          previous_status: expectedStatus,
          new_status: newStatus,
          remarks: remarks || null
        }
      }
    });

    return { application: updatedApplication, history };
  });
};

export const processFinalApproval = async (
  applicationId: string,
  userId: string,
  remarks?: string
) => {
  return await prisma.$transaction(async (tx) => {
    const application = await tx.landApplication.findUnique({
      where: { application_id: applicationId }
    });

    if (!application) {
      throw new Error('Land application not found');
    }

    if (application.status !== ApplicationStatus.PENDING_APPROVAL) {
      throw new Error(`Invalid state transition. Application is in ${application.status} state, expected ${ApplicationStatus.PENDING_APPROVAL}`);
    }

    // Create LandAsset from approved application data
    const newAsset = await tx.landAsset.create({
      data: {
        application_id: application.application_id,
        land_id: application.land_id,
        survey_no: application.survey_no,
        owner_name: application.owner_name,
        area: application.area,
        latitude: application.latitude,
        longitude: application.longitude,
        asset_type: application.asset_type,
        description: application.description,
        approved_by: userId
      }
    });

    // Update the application status
    const updatedApplication = await tx.landApplication.update({
      where: { application_id: applicationId },
      data: { status: ApplicationStatus.APPROVED }
    });

    // Create workflow history record
    const history = await tx.workflowHistory.create({
      data: {
        application_id: applicationId,
        previous_status: ApplicationStatus.PENDING_APPROVAL,
        new_status: ApplicationStatus.APPROVED,
        action_by: userId,
        remarks: remarks || null
      }
    });

    // Create asset event
    await tx.assetEvent.create({
      data: {
        application_id: applicationId,
        asset_id: newAsset.asset_id, // We populate asset_id here! Wait, the instruction says "ASSET_APPROVED", does it need asset_id? Schema says nullable. 
        event_type: EventType.ASSET_APPROVED,
        performed_by: userId,
        metadata: {
          previous_status: ApplicationStatus.PENDING_APPROVAL,
          new_status: ApplicationStatus.APPROVED,
          asset_id: newAsset.asset_id,
          remarks: remarks || null
        }
      }
    });

    return { application: updatedApplication, asset: newAsset, history };
  });
};
