const { CertificateRequest, Course, User, Institute } = require('../models');
const { sendEmail } = require('../utils/email.util');

exports.requestCertificate = async (req, res) => {
  try {
    const { courseId, fullName, email, mobile, address } = req.body;
    
    // Check if already requested
    const existing = await CertificateRequest.findOne({
      where: { courseId, studentId: req.user.id }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'You have already requested a certificate for this course.' });
    }
    
    const course = await Course.findByPk(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    const request = await CertificateRequest.create({
      studentId: req.user.id,
      courseId,
      instituteId: course.instituteId,
      fullName,
      email,
      mobile,
      address
    });
    
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudentCertificates = async (req, res) => {
  try {
    const requests = await CertificateRequest.findAll({
      where: { studentId: req.user.id },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title', 'thumbnail'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInstituteCertificates = async (req, res) => {
  try {
    const requests = await CertificateRequest.findAll({
      where: { instituteId: req.user.instituteId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCertificateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    let { certificateUrl } = req.body;
    
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      certificateUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else if (status === 'approved' && !certificateUrl) {
      certificateUrl = `/certificate/${id}`;
    }

    const request = await CertificateRequest.findOne({
      where: { id, instituteId: req.user.instituteId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] }
      ]
    });
    
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    await request.update({
      status,
      remarks: remarks !== undefined ? remarks : request.remarks,
      certificateUrl: certificateUrl !== undefined ? certificateUrl : request.certificateUrl
    });

    // Send Email Notification asynchronously
    if (request.student && request.student.email && status !== 'pending') {
      const isApproved = status === 'approved';
      const subject = isApproved 
        ? `🎉 Certificate Approved for ${request.course?.title || 'your course'}` 
        : `Certificate Request Update for ${request.course?.title || 'your course'}`;
        
      const html = isApproved 
        ? `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
             <h2 style="color: #10b981;">Congratulations, ${request.student.name}!</h2>
             <p>Your certificate request for the course <strong>"${request.course?.title}"</strong> has been approved.</p>
             <p>You can view and download your official certificate directly from your student dashboard.</p>
             ${certificateUrl ? `<p><a href="${certificateUrl.startsWith('/') ? (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim() + certificateUrl : certificateUrl}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Certificate</a></p>` : ''}
             <br/>
             <p style="color: #64748b; font-size: 12px;">This is an automated message from the MockTest platform.</p>
           </div>`
        : `<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
             <h2 style="color: #ef4444;">Update on your Certificate Request</h2>
             <p>Hi ${request.student.name},</p>
             <p>Your certificate request for the course <strong>"${request.course?.title}"</strong> has unfortunately been rejected by the institute.</p>
             ${remarks ? `<p><strong>Reason provided:</strong> <span style="color: #64748b;">${remarks}</span></p>` : ''}
             <p>Please contact your institute directly for more information or try fulfilling the requirements and requesting again.</p>
             <br/>
             <p style="color: #64748b; font-size: 12px;">This is an automated message from the MockTest platform.</p>
           </div>`;

      sendEmail({
        to: request.student.email,
        subject,
        html
      }).catch(err => console.error('Failed to send certificate notification email:', err));
    }
    
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
