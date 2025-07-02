const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema({
  page_number: Number,
  section: String,
  reference_document: String,
  non_compliant_text: String,
  explanation: String,
  remedy_recommendation: String,
  severity_level: String,
  confidence: Number,
  result: String,
});

const detailedResultSchema = new mongoose.Schema({
  document_name: String,
  result: String,
  explanation: String,
  violations: [violationSchema],
  confidence_score: Number,
  input_token_count: Number,
  output_token_count: Number,
  total_token_count: Number,
});

const nonComplianceSchema = new mongoose.Schema({
  page_number: Number,
  severity_level: String,
  regulation: String,
  confidence_percentage: Number,
});

const masHistorySchema = new mongoose.Schema({
  user_name: {
    type: String,
    required: true,
  },
  input_document: String,
  compliance_score: Number,
  total_checks: Number,
  issue_counts: {
    High: Number,
    Medium: Number,
    Low: Number,
  },
  detailed_results: [detailedResultSchema],
  non_compliance_table: [nonComplianceSchema],
  generated_at: Date,
});

module.exports = mongoose.model("mas_history", masHistorySchema);
