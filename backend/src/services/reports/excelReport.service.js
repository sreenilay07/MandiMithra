const ExcelJS = require('exceljs');
const Procurement = require('../../models/Procurement');
const ProcurementStage = require('../../models/ProcurementStage');
const Payment = require('../../models/Payment');
const FarmerProfile = require('../../models/FarmerProfile');

class ExcelReportService {
  async generateProcurementReportData(filters = {}) {
    const query = {};

    if (filters.districtId) {
      // Find centres in district
      const ProcurementCentre = require('../../models/ProcurementCentre');
      const centres = await ProcurementCentre.find({ districtId: filters.districtId }).select('_id');
      query.centreId = { $in: centres.map(c => c._id) };
    }

    if (filters.centreId) {
      query.centreId = filters.centreId;
    }

    if (filters.cropId) {
      query.cropId = filters.cropId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
      query.createdAt = {};
      if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
      if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
    }

    const procurements = await Procurement.find(query)
      .populate('farmerId', 'fullName phoneNumber')
      .populate('centreId', 'name code districtId')
      .populate({ path: 'centreId', populate: { path: 'districtId', select: 'name code' } })
      .populate('cropId', 'name unit')
      .populate('tokenId', 'tokenNumber')
      .sort({ createdAt: -1 });

    const rows = [];

    for (let i = 0; i < procurements.length; i++) {
      const proc = procurements[i];

      // Fetch stages
      const stages = await ProcurementStage.find({ procurementId: proc._id }).sort({ stageNumber: 1 });
      const stageMap = {};
      stages.forEach(s => {
        stageMap[`stage_${s.stageNumber}`] = s.status;
      });

      // Fetch payment
      const payment = await Payment.findOne({ procurementId: proc._id });

      // Fetch farmer profile
      const profile = await FarmerProfile.findOne({ userId: proc.farmerId?._id });

      const phone = proc.farmerId?.phoneNumber || '';
      const maskedPhone = phone.length >= 10 ? `${phone.substring(0, 3)}****${phone.substring(phone.length - 3)}` : phone;

      rows.push({
        sNo: i + 1,
        date: proc.createdAt ? proc.createdAt.toISOString().split('T')[0] : '',
        district: proc.centreId?.districtId?.name || 'N/A',
        centre: proc.centreId?.name || 'N/A',
        tokenNumber: proc.tokenId?.tokenNumber || 'N/A',
        farmerId: profile?.farmerId || proc.farmerId?._id || 'N/A',
        farmerName: proc.farmerId?.fullName || profile?.fullName || 'N/A',
        phoneMasked: maskedPhone,
        bankAccountNumber: profile?.bankDetails?.accountNumber ? `***${profile.bankDetails.accountNumber.slice(-4)}` : 'N/A',
        crop: proc.cropId?.name || 'N/A',
        expectedQuantity: proc.expectedQuantity || 0,
        actualQuantity: proc.actualQuantity !== null ? proc.actualQuantity : 'N/A',
        arrivalTime: proc.arrivalTime ? new Date(proc.arrivalTime).toLocaleTimeString() : 'N/A',
        completionTime: proc.completionTime ? new Date(proc.completionTime).toLocaleTimeString() : 'N/A',
        maturityTest: stageMap['stage_1'] || 'PENDING',
        bagsAllocation: stageMap['stage_2'] || 'PENDING',
        bagsFilling: stageMap['stage_3'] || 'PENDING',
        bagsStitching: stageMap['stage_4'] || 'PENDING',
        weightStage: stageMap['stage_5'] || 'PENDING',
        loadingStage: stageMap['stage_6'] || 'PENDING',
        documentsStage: stageMap['stage_7'] || 'PENDING',
        lorryNumber: proc.lorryNumber || 'N/A',
        procurementStatus: proc.status,
        paymentStatus: payment?.status || 'NOT_STARTED',
        paymentAmountINR: payment?.amount || 0
      });
    }

    return rows;
  }

  async generateExcelWorkbook(filters = {}) {
    const rows = await this.generateProcurementReportData(filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AgriFlow System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Procurement Report', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    sheet.columns = [
      { header: 'S.No', key: 'sNo', width: 8 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'District', key: 'district', width: 18 },
      { header: 'Centre', key: 'centre', width: 25 },
      { header: 'Token Number', key: 'tokenNumber', width: 18 },
      { header: 'Farmer ID', key: 'farmerId', width: 16 },
      { header: 'Farmer Name', key: 'farmerName', width: 22 },
      { header: 'Phone (Masked)', key: 'phoneMasked', width: 16 },
      { header: 'Bank Account', key: 'bankAccountNumber', width: 16 },
      { header: 'Crop', key: 'crop', width: 12 },
      { header: 'Expected (KG)', key: 'expectedQuantity', width: 15 },
      { header: 'Actual (KG)', key: 'actualQuantity', width: 15 },
      { header: 'Arrival Time', key: 'arrivalTime', width: 15 },
      { header: 'Completion Time', key: 'completionTime', width: 15 },
      { header: '1. Maturity Test', key: 'maturityTest', width: 16 },
      { header: '2. Bags Allocation', key: 'bagsAllocation', width: 16 },
      { header: '3. Bags Filling', key: 'bagsFilling', width: 16 },
      { header: '4. Bags Stitching', key: 'bagsStitching', width: 16 },
      { header: '5. Weight', key: 'weightStage', width: 14 },
      { header: '6. Loading', key: 'loadingStage', width: 14 },
      { header: '7. Documents', key: 'documentsStage', width: 16 },
      { header: 'Lorry Number', key: 'lorryNumber', width: 16 },
      { header: 'Procurement Status', key: 'procurementStatus', width: 20 },
      { header: 'Payment Status', key: 'paymentStatus', width: 16 },
      { header: 'Payment Amount (INR)', key: 'paymentAmountINR', width: 20 }
    ];

    // Style Header Row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E40AF' } // Deep Royal Blue
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    rows.forEach(row => {
      sheet.addRow(row);
    });

    return workbook;
  }

  async generateCSVString(filters = {}) {
    const rows = await this.generateProcurementReportData(filters);
    if (rows.length === 0) {
      return 'S.No,Date,District,Centre,Token Number,Farmer ID,Farmer Name,Phone,Bank Account,Crop,Expected,Actual,Status,Payment Status,Payment Amount\n';
    }

    const headers = Object.keys(rows[0]).join(',');
    const csvRows = rows.map(r => Object.values(r).map(val => `"${val}"`).join(','));
    return [headers, ...csvRows].join('\n');
  }

  async generateExcelBuffer(filters = {}) {
    const workbook = await this.generateExcelWorkbook(filters);
    return await workbook.xlsx.writeBuffer();
  }

  async generateDistrictProcurementReport(districtId) {
    return await this.generateExcelBuffer({ districtId });
  }
}

module.exports = new ExcelReportService();
