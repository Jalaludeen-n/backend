const sgMail = require("@sendgrid/mail");
const fs = require("fs");
const path = require("path");
const KEY = process.env.MAIL_KEY;

sgMail.setApiKey(KEY);
function sendEmailWithPDF(recipient, Name, pdfBase64Data, level) {
  const pdfFileName = "Result.pdf";
  const pdfBuffer = Buffer.from(pdfBase64Data, "base64");

  const pdfFilePath = path.join(__dirname, pdfFileName);
  fs.writeFileSync(pdfFilePath, pdfBuffer);
  const templatePath = path.join(__dirname, "score.html");
  const htmlTemplate = fs.readFileSync(templatePath, "utf-8");
  const replacedTemplate = htmlTemplate
    .replace("{{Name}}", Name)
    .replace("{{level}}", level);
  console.log("PDF File written successfully.");
  const msg = {
    to: recipient,
    from: "notifications@tomorrow.college",
    subject: `Hi ${Name}, your score`,
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
      fs.unlinkSync(pdfFilePath);
    })
    .catch((error) => {
      console.error("Error while sending email:", error);
      fs.unlinkSync(pdfFilePath);
    });
}

module.exports = {
  sendEmailWithPDF,
};
