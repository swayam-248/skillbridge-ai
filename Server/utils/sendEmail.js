const nodemailer = require('nodemailer');

const sendEmail = async (email, otp) =>{
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
      user: process.env.EMAIL_USER || 'sahoreswayam@gmail.com',
      pass: process.env.EMAIL_PASS || 'qkih cyvc uars hlnv'
    }
  });

  const mailOptions = {
    from: '"SkillBridge AI" <sahoreswayam@gmail.com>',
    to: email,
    subject: 'Your SkillBridge Access Code',
    text: `Your one-time login code is : ${otp}. This code expires in 5 minutes`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;