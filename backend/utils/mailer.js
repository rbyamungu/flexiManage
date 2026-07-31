const logger = require('../logging/logging')({ module: module.filename, type: 'req' });

class Mailer {
  constructor (host, port, bypassCertificate = false) {
    this.sendMailHTML = this.sendMailHTML.bind(this);
  }

  sendMailHTML (envelopeFrom, from, to, subject, html) {
    logger.info(`[DEV MOCK MAILER] Bypassed sending email to: ${to}`);
    return Promise.resolve(true);
  }
}

let mailerHandler = null;
module.exports = function (host, port, bypassCertificate) {
  if (mailerHandler) return mailerHandler;
  else {
    mailerHandler = new Mailer(host, port, bypassCertificate);
    return mailerHandler;
  }
};
