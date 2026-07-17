export const DOSAGE_FORMS = [
  'tablet',
  'capsule',
  'oral solution',
  'oral suspension',
  'injection',
  'cream',
  'ointment',
  'inhaler',
  'patch',
  'suppository',
  'other',
];

export const AUTHORITIES = ['MHRA', 'EMA', 'FDA', 'other'];

export const SUBMISSION_TYPES = ['new', 'variation', 'renewal'];

export const SUBMISSION_STATUSES = ['draft', 'in-review', 'submitted', 'approved', 'rejected'];

export const MODULE_STATUSES = ['not-started', 'draft', 'in-review', 'approved'];

export const ROLES = ['regulatory', 'qa', 'manufacturing', 'admin'];

export const STATUS_LABELS = {
  'not-started': 'Not started',
  draft: 'Draft',
  'in-review': 'In review',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const ROLE_LABELS = {
  regulatory: 'Regulatory Affairs',
  qa: 'Quality Assurance',
  manufacturing: 'Manufacturing',
  admin: 'Administrator',
};
