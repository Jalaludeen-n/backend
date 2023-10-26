const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(
  "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",
);

function sendEmailWithPDF(recipient, Name, pdfURL) {
  const msg = {
    to: recipient,
    from: "hello@courageousteams.com",
    subject: "test",
    templateId: "d-6fc0287ba0134144997b3952fec0167d", // Replace with your template ID
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
