import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import { getSpectatorAssignments, submitSpectatorResult } from '../controllers/matchController.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate, requireRole(ROLES.SPECTATOR, ROLES.ADMIN, ROLES.SUPERADMIN));

router.get('/assignments', getSpectatorAssignments);
router.post('/matches/:id/results', submitSpectatorResult);
router.post('/matches/:id/evidence', upload.array('screenshots', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No screenshot files uploaded' });
  }
  const urls = req.files.map((f) => `/uploads/evidence/${f.filename}`);
  res.json({ success: true, message: 'Evidence screenshots uploaded successfully', urls });
});

export default router;
