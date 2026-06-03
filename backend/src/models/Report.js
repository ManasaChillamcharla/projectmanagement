import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    reportType: { type: String, required: true },
    content: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
