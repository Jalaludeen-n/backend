const sgMail = require("@sendgrid/mail");
const fs = require("fs");
const path = require("path");
const KEY = process.env.MAIL_KEY;

sgMail.setApiKey(KEY);
function sendEmailWithPDF(recipient, Name, pdfBase64Data) {
  const pdfFileName = "Result.pdf";
  const pdfBuffer = Buffer.from(pdfBase64Data, "base64");

  const pdfFilePath = path.join(__dirname, pdfFileName);
  fs.writeFileSync(pdfFilePath, pdfBuffer);
  const templatePath = path.join(__dirname, "score.html");
  const htmlTemplate = fs.readFileSync(templatePath, "utf-8");
  const replacedTemplate = htmlTemplate.replace("{{Name}}", Name);

  const msg = {
    to: recipient,
    from: "hello@courageousteams.com",
    subject: `${Name}, your score`,
    text: "This is a test email with an attached PDF.",
    attachments: [
      {
        content: pdfBuffer.toString("base64"),
        filename: pdfFileName,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
    html: replacedTemplate,
    // templateId: "d-6fc0287ba0134144997b3952fec0167d",
    dynamicTemplateData: {
      Name,
    },
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
      // Delete the PDF file after sending the email (optional)
      fs.unlinkSync(pdfFilePath);
    })
    .catch((error) => {
      console.error(error);
      // Delete the PDF file in case of an error (optional)
      fs.unlinkSync(pdfFilePath);
    });
}

module.exports = {
  sendEmailWithPDF,
};
