const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "package-lock.json");
let s = fs.readFileSync(filePath, "utf8");
const out = [];
let i = 0;
while (i < s.length) {
  const headMark = s.indexOf("<<<<<<< HEAD", i);
  if (headMark === -1) {
    out.push(s.slice(i));
    break;
  }
  out.push(s.slice(i, headMark));
  const headStart = headMark + "<<<<<<< HEAD\n".length;
  let eq = s.indexOf("\n=======", headMark);
  if (eq === -1) eq = s.indexOf("=======", headMark);
  const endMark = s.indexOf(">>>>>>>", eq !== -1 ? eq : headMark);
  if (eq === -1 || endMark === -1) {
    out.push(s.slice(headStart));
    break;
  }
  const headEnd = eq;
  out.push(s.slice(headStart, headEnd));
  const nextLine = s.indexOf("\n", endMark);
  i = nextLine === -1 ? s.length : nextLine + 1;
}
fs.writeFileSync(filePath, out.join(""));
console.log("Resolved package-lock.json");
