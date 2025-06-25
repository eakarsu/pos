require('dotenv/config');
const nodemailer = require('nodemailer');

async function testEmailSending() {
  console.log('🧪 Email Sending Test');
  console.log('====================');
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || 'NOT SET'}`);
  console.log(`SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`);
  console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '[SET]' : 'NOT SET'}`);
  console.log(`SMTP_FROM: ${process.env.SMTP_FROM || 'NOT SET'}`);
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ Missing required SMTP configuration');
    return;
  }
  
  const port = parseInt(process.env.SMTP_PORT || '587');
  const isSSL = port === 465;
  
  console.log(`\n Configuration:`);
  console.log(`Port: ${port}`);
  console.log(`SSL: ${isSSL}`);
  console.log(`Encryption: ${isSSL ? 'SSL' : 'STARTTLS'}`);
  
  // Test both configurations
  const configs = [
    {
      name: 'Primary Config',
      config: {
        host: process.env.SMTP_HOST,
        port: port,
        secure: isSSL,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        ...(isSSL ? {
          tls: {
            rejectUnauthorized: false,
            servername: process.env.SMTP_HOST
          }
        } : {
          requireTLS: true,
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          }
        }),
        debug: true,
        logger: true
      }
    },
    {
      name: 'Alternative Config (Port 465 SSL)',
      config: {
        host: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: {
          rejectUnauthorized: false,
          servername: process.env.SMTP_HOST
        },
        debug: true,
        logger: true
      }
    },
    {
      name: 'Alternative Config (Port 587 STARTTLS)',
      config: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        requireTLS: true,
        tls: {
          rejectUnauthorized: false
        },
        debug: true,
        logger: true
      }
    }
  ];
  
  for (const { name, config } of configs) {
    console.log(`\n🔄 Testing ${name}...`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Secure: ${config.secure}`);
    
    try {
      const transporter = nodemailer.createTransport(config);
      
      console.log('   📡 Verifying connection...');
      await transporter.verify();
      console.log('   ✅ Connection verified successfully!');
      
      console.log('   📧 Sending test email...');
      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: 'support@elitepos.chat',
        subject: 'Test Email from ElitePos Contact Form',
        text: `This is a test email sent at ${new Date().toISOString()}
        
Configuration: ${name}
Host: ${config.host}:${config.port}
Secure: ${config.secure}

If you receive this email, the SMTP configuration is working correctly!`,
        html: `<h2>Test Email from ElitePos Contact Form</h2>
        <p>This is a test email sent at <strong>${new Date().toISOString()}</strong></p>
        <ul>
          <li><strong>Configuration:</strong> ${name}</li>
          <li><strong>Host:</strong> ${config.host}:${config.port}</li>
          <li><strong>Secure:</strong> ${config.secure}</li>
        </ul>
        <p>If you receive this email, the SMTP configuration is working correctly!</p>`
      });
      
      console.log('   ✅ Email sent successfully!');
      console.log(`   📨 Message ID: ${result.messageId}`);
      console.log(`   📬 Response: ${result.response}`);
      
      // If we get here, this configuration works
      console.log(`\n🎉 SUCCESS! ${name} is working correctly.`);
      console.log('You can use this configuration in your application.');
      break;
      
    } catch (error) {
      console.log(`   ❌ ${name} failed:`);
      console.log(`   Error: ${error.message}`);
      if (error.code) {
        console.log(`   Code: ${error.code}`);
      }
      if (error.response) {
        console.log(`   Response: ${error.response}`);
      }
      console.log('');
    }
  }
  
  console.log('\n🏁 Email test completed.');
  console.log('\nIf all configurations failed, please check:');
  console.log('1. Your SMTP credentials are correct');
  console.log('2. Your email account has SMTP enabled');
  console.log('3. Your hosting provider allows SMTP connections');
  console.log('4. Your firewall/network allows outbound SMTP connections');
}

// Run the test
testEmailSending().catch(console.error);
