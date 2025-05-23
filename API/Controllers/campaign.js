const asyncHandler = require("../Middleware/async");
const ErrorResponse = require("../Utils/errorResponse");
const Campaign = require("../Models/Campaign");
const authMiddleware = require("../Middleware/authMiddleware");

// @Desc       Get all Campaigns
// @Route      GET /api/campaigns
// @Access     Public
exports.getCampaigns = asyncHandler(async (req, res) => {
  let query;
  const { search, ...restQuery } = req.query;

  // Remove fields that are not for filtering
  ["sort", "select", "page", "limit", "search"].forEach(
    (param) => delete restQuery[param]
  );

  // Convert MongoDB operators to $gt, $lt, etc.
  let queryStr = JSON.stringify(restQuery).replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Base MongoDB query
  let mongoQuery = JSON.parse(queryStr);

  // Add search if present
  if (search) {
    mongoQuery.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  query = Campaign.find(mongoQuery)
    .populate("userId", "name email")
    .select("-metadata");

  // Select fields
  if (req.query.select) {
    query = query.select(req.query.select.split(",").join(" "));
  }

  // Sorting
  query = req.query.sort
    ? query.sort(req.query.sort.split(",").join(" "))
    : query.sort({ updatedAt: -1 });

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  // Execute query
  const campaigns = await query;
  res
    .status(200)
    .json({ success: true, count: campaigns.length, data: campaigns });
});

// @Desc       Get Single Campaign by ID or Slug
// @Route      GET /api/campaigns/:id
// @Access     Public
exports.getCampaign = asyncHandler(async (req, res, next) => {
  let campaign = await Campaign.findOne({
    $or: [
      { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
      { slug: req.params.id },
    ],
  }).populate("userId", "name email");

  if (!campaign) {
    return next(new ErrorResponse(`Campaign not found!`, 404));
  }

  res.status(200).json({ success: true, data: campaign });
});

// @Desc       Create New Campaign
// @Route      POST /api/campaigns
// @Access     Private
exports.postCampaign = asyncHandler(async (req, res) => {

  try {
  const userId = req.user.id;
  console.log(userId);
  const { title, description, goalAmount, startDate, endDate, category, link } =
    req.body;

  const imageUrls = req.files?.image?.map((file) => file.path) || [];
  const videoUrls = req.files?.video?.map((file) => file.path) || [];
  const documentUrls = req.files?.document?.map((file) => file.path) || [];
  const linkArray = Array.isArray(link) ? link : link ? [link] : [];

  let campaign = await Campaign.create({
    userId,
    title,
    description,
    goalAmount,
    category,
    startDate,
    endDate,
    image: imageUrls,
    video: videoUrls,
    document: documentUrls,
    link: linkArray,
  });

  // Populate user info in the created campaign
  campaign = await campaign.populate("userId", "name email");

  res.status(201).json({ success: true, data: campaign });
}
  catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @Desc       Update Campaign
// @Route      PUT /api/campaigns/:id
// @Access     Private
exports.putCampaign = asyncHandler(async (req, res, next) => {
  const imageUrls = (req.files?.image || []).map((file) => file.path);
  const videoUrls = (req.files?.video || []).map((file) => file.path);
  const documentUrls = (req.files?.document || []).map((file) => file.path);
  const linkArray = Array.isArray(req.body.link)
    ? req.body.link
    : req.body.link
    ? [req.body.link]
    : [];

  const updatedData = { ...req.body };

  if (imageUrls.length > 0) updatedData.image = imageUrls;
  if (videoUrls.length > 0) updatedData.video = videoUrls;
  if (documentUrls.length > 0) updatedData.document = documentUrls;
  if (req.body.link !== undefined) updatedData.link = linkArray;

  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return next(new ErrorResponse(`Campaign not found!`, 404));
  }

  // if (campaign.userId.toString() !== req.user.id) {
  //   return next(
  //     new ErrorResponse(`Not authorized to update this campaign`, 403)
  //   );
  // }

  const updatedCampaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    updatedData,
    { new: true, runValidators: true }
  ).populate("userId", "name email");

  res.status(200).json({ success: true, data: updatedCampaign });
});

// @Desc       Delete Campaign
// @Route      DELETE /api/campaigns/:id
// @Access     Private
exports.deleteCampaign = asyncHandler(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return next(new ErrorResponse(`Campaign not found!`, 404));
  }

  // if (campaign.userId.toString() !== req.user.id) {
  //   return next(
  //     new ErrorResponse(`Not authorized to delete this campaign`, 403)
  //   );
  // }

  await campaign.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @Desc       Get All Active Campaigns except the one being suspended by ID
// @Route      GET /api/campaign/active/:id
// @Access     Private
exports.getActiveCampaigns = asyncHandler(async (req, res) => {
  const activeCampaigns = await Campaign.find({
    status: "approved",
    _id: { $ne: req.params.id },
  });
  res.status(200).json({ success: true, data: activeCampaigns });
});

// @Desc    Get logged-in user's campaigns
// @Route   GET /api/campaigns/me
// @Access  Private
exports.getMyCampaigns = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const campaigns = await Campaign.find({ userId: req.user.id })
    .populate("userId", "name email")
    .skip(skip)
    .limit(limit);

  const total = await Campaign.countDocuments({ userId: req.user.id });

  res.status(200).json({
    success: true,
    count: campaigns.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: campaigns,
  });
});

exports.searchCampaigns = asyncHandler(async (req, res) => {
  try {
    const searchTerm = req.query.q;

    if (!searchTerm || searchTerm.length < 2) {
      return res.json([]);
    }

    const campaigns = await Campaign.find({
      status: "approved",
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
    })
      .select("title slug description category")
      .limit(10)
      .sort({ title: 1 });

    res.json(campaigns);
  } catch (error) {
    console.error("Search error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching campaigns" });
  }
});

// prevents a user from donating to their own campaign
exports.doesUserHaveCampaign = asyncHandler(async (req, res, next) => {
  if (req.user.id !== "_") {
    const campaign = await Campaign.find({
      userId: req.user.id,
      status: req.query.status ? req.query.status : "approved",
    });
    if (!campaign) {
      res.status(200).json({ success: false, data: false });
    } else {
      res.status(200).json({ success: true, data: campaign.length > 0 });
    }
  } else {
    res.status(200).json({ success: false, data: false });
  }
});
