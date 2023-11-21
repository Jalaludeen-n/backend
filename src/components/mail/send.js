const sgMail = require("@sendgrid/mail");
const KEY = process.env.MAIL_KEY;

sgMail.setApiKey(KEY);

function sendEmailWithPDF(recipient, Name, pdfURL) {
  const msg = {
    to: recipient,
    from: "hello@courageousteams.com",
    subject: "test",
    templateId: "d-6fc0287ba0134144997b3952fec0167d",
    dynamicTemplateData: {
      Name,
      pdf_url: pdfURL,
    },
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
}

module.exports = {
  sendEmailWithPDF,
};
