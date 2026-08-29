import { JSONContent } from "@tiptap/react";

export function generateLatex(json: JSONContent): string {
  if (!json || !json.content) return "";

  let latex = "\\documentclass{article}\n";
  latex += "\\usepackage[utf8]{inputenc}\n";
  latex += "\\usepackage{graphicx}\n";
  latex += "\\usepackage{hyperref}\n";
  latex += "\\usepackage{geometry}\n";
  latex += "\\usepackage{amsmath}\n";
  latex += "\\usepackage{tabularx}\n";
  latex += "\\geometry{a4paper, margin=1in}\n\n";
  latex += "\\begin{document}\n\n";

  latex += parseNodes(json.content);

  latex += "\n\\end{document}\n";
  return latex;
}

function parseNodes(nodes: JSONContent[]): string {
  return nodes.map(parseNode).join("\n\n");
}

function parseNode(node: JSONContent): string {
  switch (node.type) {
    case "paragraph":
      return parseInline(node);
    case "heading": {
      const level = node.attrs?.level || 1;
      const text = parseInline(node);
      if (level === 1) return `\\section*{${text}}`;
      if (level === 2) return `\\subsection*{${text}}`;
      if (level === 3) return `\\subsubsection*{${text}}`;
      return `\\textbf{${text}}\n`;
    }
    case "bulletList":
      return `\\begin{itemize}\n${parseListItems(node)}\n\\end{itemize}`;
    case "orderedList":
      return `\\begin{enumerate}\n${parseListItems(node)}\n\\end{enumerate}`;
    case "image": {
      const src = node.attrs?.src || "";
      const alt = node.attrs?.alt || "";
      // Very basic image handling
      return `\\begin{figure}[h]\n\\centering\n\\includegraphics[width=0.5\\textwidth]{${src}}\n\\caption{${escapeLatex(alt)}}\n\\end{figure}`;
    }
    case "table": {
      if (!node.content) return "";
      let cols = 1;
      if (node.content[0]?.content) {
        cols = node.content[0].content.length;
      }
      const colFormat = Array(cols).fill("X").join("|");
      return `\\begin{tabularx}{\\textwidth}{|${colFormat}|}\n\\hline\n${node.content.map(parseTableRow).join("\\hline\n")}\\hline\n\\end{tabularx}`;
    }
    default:
      if (node.text) return parseInline({ content: [node] });
      return "";
  }
}

function parseListItems(listNode: JSONContent): string {
  if (!listNode.content) return "";
  return listNode.content
    .map((item) => `\\item ${item.content ? parseNodes(item.content) : ""}`)
    .join("\n");
}

function parseTableRow(rowNode: JSONContent): string {
  if (!rowNode.content) return "";
  const cells = rowNode.content.map((cell) => {
    return cell.content ? parseInline(cell) : "";
  });
  return `${cells.join(" & ")} \\\\\n`;
}

function parseInline(node: JSONContent): string {
  if (!node.content) return "";

  return node.content
    .map((child) => {
      if (child.type === "text") {
        let text = escapeLatex(child.text || "");
        if (child.marks) {
          for (const mark of child.marks) {
            if (mark.type === "bold") text = `\\textbf{${text}}`;
            if (mark.type === "italic") text = `\\textit{${text}}`;
            if (mark.type === "underline") text = `\\underline{${text}}`;
            if (mark.type === "textStyle") {
              const fontSize = mark.attrs?.fontSize;
              if (fontSize) {
                // Approximate sizing for LaTeX
                if (fontSize.includes("24") || fontSize.includes("30")) text = `{\\Large ${text}}`;
                else if (fontSize.includes("36")) text = `{\\huge ${text}}`;
                else if (fontSize.includes("10")) text = `{\\small ${text}}`;
              }
            }
          }
        }
        return text;
      }
      if (child.type === "hardBreak") {
        return "\\\\";
      }
      return parseNode(child);
    })
    .join("");
}

function escapeLatex(str: string): string {
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}
