module.exports = {
    smtp: {
      host: 'email-smtp.ap-southeast-1.amazonaws.com',
      port: 587,
      secure: false,
      auth: {
        user: 'AKIA5IV3CTI2U2R76GP4',
        pass: 'BNte9q7wCsLwrXo1FFvsW1GLz7DGjSAoivsv3GcAUqSI',
      },
      tls: {
        rejectUnauthorized: false
      }
    },
    fromEmail: 'no-reply@hostelbrisasdelsur.cl',
    fromName: "##randomcompany##",
  
    customHeaders: {
      "Reply-To": "",
      "Cc": "",
      "X-Confirm-Reading-To": "",
      "Disposition-Notification-To": "",
      "Return-Path": "",
      "X-Mailprotector-Decision": "deliver",
      "X-Mailer": ""
    },
    enableCustomHeaders: true,
    enableHTMLImage: true,
    enableAttachment: true,
    subject: "##randomcompany##",
    sendOneAttachment: false, // true to send one attachment, false to send multiple
    sendAttachment: 1, // 1 for the first attachment, 2 for the second attachment
    sendMultipleAttachments: false, // true to send both attachments
    cidMappings: require('./cids.json') // Importing CID mappings
  };
  
