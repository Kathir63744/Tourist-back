const Contact = require('../models/Contact');

// Submit contact form
exports.submitContactForm = async (req, res) => {
  try {
    console.log('📧 Contact form submission:', req.body);
    
    const contact = new Contact({
      ...req.body,
      status: 'new'
    });

    await contact.save();
    
    console.log('✅ Contact saved:', contact._id);
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will contact you soon.',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        status: contact.status,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: error.message
    });
  }
};

// Get all contacts (admin)
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: contacts.length,
      contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts'
    });
  }
};