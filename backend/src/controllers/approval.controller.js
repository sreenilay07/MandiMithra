const approvalService = require('../services/approval.service');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { BadRequestError } = require('../utils/customErrors');

class ApprovalController {
  getPendingCentreManagers = asyncWrapper(async (req, res) => {
    const districtId = req.user.districtId || req.query.districtId;
    if (!districtId && req.user.role !== 'SUPER_ADMIN') {
      throw new BadRequestError('District ID associated with District Administrator was not found.');
    }
    const requests = await approvalService.getPendingCentreManagersForDistrict(districtId);
    return sendSuccess(res, 'Pending Centre Manager requests retrieved successfully.', requests);
  });

  getPendingCentreOperators = asyncWrapper(async (req, res) => {
    const centreId = req.user.centreId || req.query.centreId;
    if (!centreId && req.user.role !== 'SUPER_ADMIN') {
      throw new BadRequestError('Centre ID associated with Centre Manager was not found.');
    }
    const requests = await approvalService.getPendingCentreOperatorsForCentre(centreId);
    return sendSuccess(res, 'Pending Centre Operator requests retrieved successfully.', requests);
  });

  getPendingDistrictAdmins = asyncWrapper(async (req, res) => {
    const requests = await approvalService.getPendingDistrictAdmins();
    return sendSuccess(res, 'Pending District Admin requests retrieved successfully.', requests);
  });

  approveRequest = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { remarks } = req.body;
    const result = await approvalService.approveRequest(id, req.user, remarks);
    return sendSuccess(res, result.message, result);
  });

  rejectRequest = asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { rejectionReason, remarks } = req.body;
    const result = await approvalService.rejectRequest(id, req.user, rejectionReason, remarks);
    return sendSuccess(res, result.message, result);
  });
}

module.exports = new ApprovalController();
