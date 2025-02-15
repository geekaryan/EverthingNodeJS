//npm i nodemailer
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
//so basically we want our email handler to be more  flexible to send
//email when welcoming to our site or like when we are doing password
//reset

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Aryan Rana <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //sendgrid
      return 1;
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //this send function is the most generic one all can use this send function to do their specific things
  //send the actual email
  async send(template, subject) {
    //1) Render HTML based on pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    //2) Define the email option
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,

      //we want to show only text from html so we are using the package html-to-text
      text: htmlToText.fromString(html),
    };

    //3) create a transport and send email
    //await transporter.sendMail(mailOptions);
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to the Natours Family!');
  }
};

// const sendEmail = async (options) => {
//   //3 steps to send a email using nodemailer..

//   ///1)) Create a transporter
//   // const transporter = nodemailer.createTransport({
//   //   // service: 'Gmail',
//   //   host: process.env.EMAIL_HOST,
//   //   port: process.env.EMAIL_PORT,
//   //   secure: false,
//   //   auth: {
//   //     user: process.env.EMAIL_USERNAME,
//   //     pass: process.env.EMAIL_PASSWORD,
//   //   },
//   //   //Activate in gmail "less secure app" option
//   // });

//   //2)) Define the email options
//   const mailOptions = {
//     from: 'Aryan Rana <sudoaptrana2025@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html:
//   };

//   //3)) Actually send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
