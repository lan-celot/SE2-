import fs from "fs";
import path from "path";

// keep this file for updating routings when refactoring

// save this file before running in terminal:
// npx tsx replace-imports.ts

const directoryPath = "./components"; // Update this to the root folder of your TSX files
const oldImportPath = "@/components/admin-components/checkbox"; // Change this to what you want to replace
const newImportPath = "@/components/shared/ui/checkbox"; // Change this to the new path

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes(oldImportPath)) {
    const updatedContent = content.replaceAll(oldImportPath, newImportPath);
    fs.writeFileSync(filePath, updatedContent, "utf8");
    console.log(`✅ Updated: ${filePath}`);
  }
}

function walkDir(dir: string) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith(".tsx")) {
      replaceInFile(fullPath);
    }
  });
}

walkDir(directoryPath);
