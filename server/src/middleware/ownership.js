export const ownWallet = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Sign in to access your wallet.' });
  req.body ||= {};
  const requested = req.params.email || req.body.userEmail || req.body.email || req.body.captain?.email;
  const email = req.user.email.toLowerCase().trim();
  if (requested && (typeof requested !== 'string' || requested.toLowerCase().trim() !== email)) {
    return res.status(403).json({ success: false, message: 'You can only access your own wallet.' });
  }
  req.body.userEmail = email;
  req.body.email = email;
  if (req.body.captain) req.body.captain.email = email;
  next();
};
