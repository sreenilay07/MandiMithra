const qrService = require('../src/services/qr/qr.service');

describe('PROCUREMENT & QR VERIFICATION TESTS', () => {
  it('should generate and verify cryptographic signed QR code payloads', () => {
    const qrResult = qrService.generateQRPayload({
      procurementId: '60c72b2f9b1d8b23c8e4d3a1',
      tokenId: '60c72b2f9b1d8b23c8e4d3a2',
      farmerId: '60c72b2f9b1d8b23c8e4d3a3',
      centreId: '60c72b2f9b1d8b23c8e4d3a4',
      stageNumber: 1,
      type: 'STAGE'
    });

    expect(qrResult).toHaveProperty('qrData');
    expect(qrResult).toHaveProperty('signature');

    const verifiedData = qrService.verifyQRData(qrResult.qrData);
    expect(verifiedData.pId).toBe('60c72b2f9b1d8b23c8e4d3a1');
    expect(verifiedData.sn).toBe(1);
  });

  it('should throw error when scanning forged QR payloads', () => {
    const forgedQR = 'agriflow://verify?data=eyJ0eXAiOiJTVEFHRSAifQ==&sig=invalid_forged_sig';
    expect(() => {
      qrService.verifyQRData(forgedQR);
    }).toThrow();
  });
});
