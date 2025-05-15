const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const signToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h", // Access token expires in 30 minutes
    }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
const getUserFromToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId || decoded.userId === "_") return "guest";
    const user = await User.findOne({ _id: decoded.userId }).select(
      "-password -verifyToken -verifyTokenExpiry -forgotPasswordToken -forgotPasswordTokenExpiry"
    );
    return user || null;
  } catch {
    return null;
  }
};

module.exports = { signToken, verifyToken, getUserFromToken };
