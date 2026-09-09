const crypto = require('crypto');
const env = require('../../config/env');
const { BadRequestError, UnauthorizedError } = require('../../utils/customErrors');

class QRService {
  generateQRPayload({ procurementId, tokenId, farmerId, centreId, bookingId, stageNumber = 0, type = 'STAGE' }) {
    const data = {
      pId: procurementId ? procurementId.toString() : '',
      tId: tokenId ? tokenId.toString() : '',
      fId: farmerId ? farmerId.toString() : '',
      cId: centreId ? centreId.toString() : '',
      bId: bookingId ? bookingId.toString() : '',
      sn: stageNumber,
      typ: type,
      iat: Date.now()
    };

    const payloadString = JSON.stringify(data);
    const signature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(payloadString)
      .digest('hex');

    const tokenRef = bookingId ? `MND:${bookingId}` : (procurementId ? `MND:${procurementId}` : `MND:${data.tId}`);

    return {
      qrData: `mandimithra://verify?data=${Buffer.from(payloadString).toString('base64')}&sig=${signature}`,
      tokenRef,
      payload: data,
      signature
    };
  }

  verifyQRData(qrString) {
    try {
      if (!qrString) {
        throw new BadRequestError('QR code string payload is required', 'INVALID_QR');
      }

      // Support simple token ref format MND:<id>
      if (qrString.startsWith('MND:')) {
        const id = qrString.replace('MND:', '').trim();
        return {
          referenceId: id,
          type: 'MND_TOKEN'
        };
      }

      if (qrString.includes('data=')) {
        const urlParams = new URLSearchParams(qrString.split('?')[1] || qrString);
        const base64Data = urlParams.get('data');
        const signature = urlParams.get('sig');

        if (!base64Data || !signature) {
          throw new BadRequestError('Corrupted QR code payload', 'CORRUPTED_QR');
        }

        const payloadString = Buffer.from(base64Data, 'base64').toString('utf-8');
        const expectedSig = crypto
          .createHmac('sha256', env.JWT_SECRET)
          .update(payloadString)
          .digest('hex');

        if (signature !== expectedSig) {
          throw new UnauthorizedError('QR signature verification failed. Possible forgery attempt.');
        }

        const data = JSON.parse(payloadString);
        return data;
      }

      // Fallback: raw ID string
      return {
        referenceId: qrString.trim(),
        type: 'RAW_ID'
      };
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
        throw error;
      }
      throw new BadRequestError('Failed to parse and verify QR code', 'QR_PARSE_ERROR');
    }
  }
}

module.exports = new QRService();
