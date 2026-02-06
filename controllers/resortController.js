const Resort = require('../models/Resort');

// Get all resorts with filters
exports.getAllResorts = async (req, res) => {
  try {
    const { location, minPrice, maxPrice, amenities, tags, search } = req.query;
    
    let query = {};
    
    // Filter by location
    if (location && location !== 'All') {
      query.location = location;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }
    
    // Filter by amenities (if provided as comma-separated string)
    if (amenities) {
      const amenityArray = amenities.split(',');
      query.amenities = { $in: amenityArray };
    }
    
    // Filter by tags (if provided as comma-separated string)
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const resorts = await Resort.find(query).sort({ rating: -1 });
    
    res.json({
      success: true,
      count: resorts.length,
      resorts
    });
  } catch (error) {
    console.error('Error fetching resorts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resorts'
    });
  }
};

// Get single resort by ID
exports.getResortById = async (req, res) => {
  try {
    const resort = await Resort.findOne({ id: req.params.id });
    
    if (!resort) {
      return res.status(404).json({
        success: false,
        error: 'Resort not found'
      });
    }
    
    res.json({
      success: true,
      resort
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resort'
    });
  }
};

// Create new resort (for admin)
exports.createResort = async (req, res) => {
  try {
    const resort = new Resort(req.body);
    await resort.save();
    
    res.status(201).json({
      success: true,
      message: 'Resort created successfully',
      resort
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};//controllers/resortcontroller