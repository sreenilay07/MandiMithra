const express = require('express');
const asyncWrapper = require('../utils/asyncWrapper');
const { sendSuccess } = require('../utils/responseHandler');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { ROLES } = require('../constants/roles');
const excelReportService = require('../services/reports/excelReport.service');

const router = express.Router();

router.use(protect);

/**
 * @route GET /api/v1/reports/procurement
 * @desc Get JSON formatted procurement report
 */
router.get('/procurement', requireRole(ROLES.DISTRICT_OFFICER, ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  if (req.user.role === ROLES.DISTRICT_OFFICER || req.user.role === ROLES.DISTRICT_ADMIN) {
    req.query.districtId = req.user.districtId;
  }
  const data = await excelReportService.generateProcurementReportData(req.query);
  return sendSuccess(res, 'Procurement report data retrieved', {
    totalRecords: data.length,
    report: data
  });
}));

/**
 * @route GET /api/v1/reports/procurement/excel
 * @desc Download Excel report (.xlsx) using ExcelJS
 */
router.get('/procurement/excel', requireRole(ROLES.DISTRICT_OFFICER, ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  if (req.user.role === ROLES.DISTRICT_OFFICER || req.user.role === ROLES.DISTRICT_ADMIN) {
    req.query.districtId = req.user.districtId;
  }
  const workbook = await excelReportService.generateExcelWorkbook(req.query);

  const filename = `AgriFlow_Procurement_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}));

/**
 * @route GET /api/v1/reports/procurement/csv
 * @desc Download CSV report (.csv)
 */
router.get('/procurement/csv', requireRole(ROLES.DISTRICT_OFFICER, ROLES.CENTRE_MANAGER, ROLES.SUPER_ADMIN), asyncWrapper(async (req, res) => {
  if (req.user.role === ROLES.DISTRICT_OFFICER || req.user.role === ROLES.DISTRICT_ADMIN) {
    req.query.districtId = req.user.districtId;
  }
  const csvContent = await excelReportService.generateCSVString(req.query);

  const filename = `AgriFlow_Procurement_Report_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  res.status(200).send(csvContent);
}));

module.exports = router;
