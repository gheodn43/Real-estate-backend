import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  human: { type: String, required: true },
  agent: { type: String },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  timestamp: { type: Date, default: Date.now },
});

const ConversationSchema = new mongoose.Schema({
  userEmail: { type: String },
  userIP: { type: String },
  sessionId: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  memory: { type: [MessageSchema], default: [] },
  context: { type: String, default: 'Cuộc trò chuyện mới bắt đầu.' },
  lastKnownFilters: { type: Object, default: {} },
  lastInteraction: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
});

ConversationSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

export default mongoose.model('Conversation', ConversationSchema);
