import mongoose from "mongoose";

const agentExecutionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    agentName: { type: String, required: true },
    output: { type: mongoose.Schema.Types.Mixed, default: null },
    executionTime: { type: Number, default: 0 },
    status: { type: String, enum: ["queued", "running", "completed", "failed"], default: "queued" },
    error: { type: String, default: "" }
  },
  { timestamps: true }
);

export const AgentExecution = mongoose.model("AgentExecution", agentExecutionSchema);
