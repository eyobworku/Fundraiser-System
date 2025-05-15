const asyncHandler = require("../Middleware/async");
const User = require("../Models/User");
const { getUserFromToken } = require("../Utils/jwt");

exports.getUser = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id).select(
    "-password -verifyToken -verifyTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry"
  );

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json(user);
});
exports.getUsers = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const search = req.query.search || "";
  const skip = (page - 1) * limit;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .skip(skip)
    .limit(limit)
    .select(
      "-password -verifyToken -verifyTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry"
    );

  // Get total count of matching users
  const filteredCount = await User.countDocuments(query);

  res.json({
    users,
    count: filteredCount,
    page,
    totalPages: Math.ceil(filteredCount / limit),
    limit,
  });
});
exports.getLoggedInUser = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ loggedIn: false });
  const user = await getUserFromToken(token);
  if (user === "guest") return res.status(401).json({ loggedIn: false });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json(user);
});

//update user by id role,block,name,email,password
exports.updateUser = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { role, avatar, name, email, blocked, bio, releasedMoney } = req.body;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (String(blocked)) user.blocked = Boolean(blocked);
  if (name) user.name = name;
  if (email) user.email = email;
  if (avatar) user.avatar = avatar;
  if (role) user.role = role;
  if (bio) user.bio = bio;
  if (releasedMoney) user.releasedMoney = releasedMoney;
  await user.save();

  res.json({ message: "User updated" });
});
//delete user by id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ message: "User deleted" });
});
//
