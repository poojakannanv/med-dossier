const mongoose = require('mongoose');

const DOSAGE_FORMS = [
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

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    activeIngredient: {
      type: String,
      required: [true, 'Active ingredient is required'],
      trim: true,
      maxlength: 200,
    },
    dosageForm: {
      type: String,
      required: [true, 'Dosage form is required'],
      enum: DOSAGE_FORMS,
    },
    strength: {
      type: String,
      required: [true, 'Strength is required'],
      trim: true,
      maxlength: 100,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
      maxlength: 200,
    },
    mah: {
      type: String,
      required: [true, 'Marketing authorisation holder is required'],
      trim: true,
      maxlength: 200,
    },
    atcCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 10,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ productName: 1 });
productSchema.index({ dosageForm: 1 });
productSchema.index({ productName: 'text', activeIngredient: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
module.exports.DOSAGE_FORMS = DOSAGE_FORMS;
