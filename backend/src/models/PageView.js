import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  url:         { type: String, required: true },
  referrer:    { type: String, default: '' },
  sessionId:   { type: String, required: true },
  ip:          { type: String, default: '' },
  userAgent:   { type: String, default: '' },
  country:     { type: String, default: '' },
  // enriched fields
  eventType:   { type: String, default: 'pageview' }, // pageview | click | scroll | session_end
  element:     { type: String, default: '' },          // for click events: button label
  device:      { type: String, default: '' },          // mobile | tablet | desktop
  language:    { type: String, default: '' },          // browser language
  duration:    { type: Number, default: 0 },           // session duration in seconds
  scrollDepth: { type: Number, default: 0 },           // max scroll % reached
  createdAt:   { type: Date, default: Date.now },
});

schema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
schema.index({ createdAt: -1 });
schema.index({ url: 1 });
schema.index({ sessionId: 1 });
schema.index({ eventType: 1 });

export default mongoose.model('PageView', schema);
