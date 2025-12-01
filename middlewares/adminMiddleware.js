//@desc middleware to check if there is already one admin in the system
//how to use: add to the route before the controller function 
exports.oneAdmin = () => {
  return async (req, res, next) => {
    const adminCount = await User.countDocuments({ role: "admin" });

    if (adminCount >= 1 && req.body.role === "admin") {
      return res.status(403).json({ message: "There can only be one admin on this system" });
    }

    next();
  };
};

// Restrict access based on role
exports.adminOnly = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }

    next();
  };
};