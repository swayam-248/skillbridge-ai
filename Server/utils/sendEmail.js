const nodemailer = require('nodemailer');

const sendEmail = async (email, otp) =>{
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials are not configured');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"SkillBridge AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your SkillBridge Access Code',
    text: `Your one-time login code is : ${otp}. This code expires in 5 minutes`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
