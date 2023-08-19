const fs = require("fs");
const path = require("path");
const getFile = (pdfArray, name) => {
  for (const file of pdfArray) {
    if (file.originalname === name) {
      const uploadsPath = path.join(__dirname, "../uploads");
      const filePath = path.join(uploadsPath, name);
      fs.writeFileSync(filePath, file.buffer);
      return filePath;
    }
  }
  return null;
};

const generateUniqueCode = (length) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  const timestamp = Date.now().toString(36).toUpperCase();
  code = timestamp + code;

  return code.substring(0, length);
};
const getDate = () => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
    new Date(),
  );
  return formattedDate;
};

module.exports = {
  getFile,
  generateUniqueCode,
  getDate,
};
