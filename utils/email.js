// const nodemailer = require('nodemailer');

// // Create a test email transporter (no credentials needed)
// const createTransporter = () => {
//   // For development/testing, we can use a fake email service
//   if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST) {
//     console.log('📧 Using test email transporter (development mode)');
    
//     // Create a test account (no real email needed)
//     return nodemailer.createTestAccount().then(testAccount => {
//       return nodemailer.createTransport({
//         host: 'smtp.ethereal.email',
//         port: 587,
//         secure: false,
//         auth: {
//           user: testAccount.user,
//           pass: testAccount.pass
//         }
//       });
//     });
//   }
  
//   // For production, use real email credentials
//   return Promise.resolve(nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     secure: process.env.EMAIL_SECURE === 'true',
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD
//     }
//   }));
// };

// // Send email function
// const sendEmail = async (options) => {
//   try {
//     const transporter = await createTransporter();
    
//     const mailOptions = {
//       from: process.env.EMAIL_FROM || 'Food App <noreply@foodapp.com>',
//       to: options.email,
//       subject: options.subject,
//       text: options.message,
//       // If you want HTML emails, uncomment below:
//       // html: options.html || `<p>${options.message}</p>`
//     };
    
//     console.log('📧 Attempting to send email to:', options.email);
//     console.log('📧 Subject:', options.subject);
    
//     const info = await transporter.sendMail(mailOptions);
    
//     // In development, log the test email URL
//     if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST) {
//       console.log('✅ Test email sent! Preview URL:', nodemailer.getTestMessageUrl(info));
//     } else {
//       console.log('✅ Email sent successfully. Message ID:', info.messageId);
//     }
    
//     return info;
//   } catch (error) {
//     console.error('❌ Email sending failed:', error.message);
//     console.error('Full error:', error);
//     throw new Error('Failed to send email. Please try again later.');
//   }
// };

// server/utils/email.js
const nodemailer = require('nodemailer');

const sendEmail = async options => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${options.subject}</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
            ${options.message.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This is an automated message from Food App.
          </p>
        </div>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    // Log preview URL for testing
    console.log('📧 Email sent! Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

module.exports = sendEmail;