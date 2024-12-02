//npm i nodemailer
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //3 steps to send a email using nodemailer..

  ///1)) Create a transporter
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //Activate in gmail "less secure app" option
  });

  //2)) Define the email options
  const mailOptions = {
    from: 'Aryan Rana <sudoaptrana2025@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  //3)) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
