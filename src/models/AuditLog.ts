import mongoose, { Schema, Model } from 'mongoose';

const AuditLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId },
    beforeSummary: { type: String },
    afterSummary: { type: String },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

const AuditLog: Model<any> = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

export default AuditLog;
