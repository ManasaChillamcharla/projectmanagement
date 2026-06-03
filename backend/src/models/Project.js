import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    requirement: { type: String, required: true },
    status: {
      type: String,
      enum: ["Draft", "Planning", "Active", "Completed", "Archived"],
      default: "Draft"
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
