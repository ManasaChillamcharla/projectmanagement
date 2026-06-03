import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { AgentExecution } from "../models/AgentExecution.js";
import { Project } from "../models/Project.js";

function titleFromKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function outputToText(output, depth = 0) {
  if (output === null || output === undefined) return "";
  if (typeof output === "string") return output;
  if (typeof output === "number" || typeof output === "boolean") return String(output);

  const indent = "  ".repeat(depth);

  if (Array.isArray(output)) {
    return output
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return `${indent}- ${outputToText(item, depth + 1).trim()}`;
        }
        return `${indent}- ${outputToText(item, depth + 1)}`;
      })
      .join("\n");
  }

  if (typeof output === "object") {
    return Object.entries(output)
      .map(([key, value]) => {
        const formattedValue = outputToText(value, depth + 1).trim();
        if (!formattedValue) return "";
        if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
          return `${indent}${titleFromKey(key)}:\n${formattedValue}`;
        }
        return `${indent}${titleFromKey(key)}: ${formattedValue}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  return String(output);
}

async function getProjectBundle(projectId) {
  const project = await Project.findById(projectId);
  const executions = await AgentExecution.find({ projectId }).sort("createdAt");
  return { project, executions };
}

export async function streamPdf(projectId, res) {
  const { project, executions } = await getProjectBundle(projectId);
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${project.title}-planning-report.pdf"`);
  doc.pipe(res);
  doc.fontSize(20).text(project.title);
  doc.moveDown().fontSize(11).text(project.requirement);
  executions.forEach((execution) => {
    doc.moveDown().fontSize(15).text(execution.agentName);
    doc.fontSize(10).text(outputToText(execution.output) || "No output available.");
  });
  doc.end();
}

export async function streamDocx(projectId, res) {
  const { project, executions } = await getProjectBundle(projectId);
  const children = [
    new Paragraph({ children: [new TextRun({ text: project.title, bold: true, size: 32 })] }),
    new Paragraph(project.requirement)
  ];

  executions.forEach((execution) => {
    children.push(new Paragraph({ children: [new TextRun({ text: execution.agentName, bold: true })] }));
    outputToText(execution.output)
      .split("\n")
      .forEach((line) => children.push(new Paragraph(line || " ")));
  });

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${project.title}-planning-report.docx"`);
  res.send(buffer);
}

export async function streamSprintXlsx(projectId, res) {
  const { project, executions } = await getProjectBundle(projectId);
  const sprint = executions.find((item) => item.agentName === "Sprint Planner");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sprint Plan");
  sheet.columns = [
    { header: "Project", key: "project", width: 28 },
    { header: "Agent", key: "agent", width: 24 },
    { header: "Output", key: "output", width: 80 }
  ];
  sheet.addRow({ project: project.title, agent: "Sprint Planner", output: outputToText(sprint?.output) || "No sprint plan available." });
  sheet.getColumn("output").alignment = { wrapText: true, vertical: "top" };

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${project.title}-sprint-plan.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}
