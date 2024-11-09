#!/usr/bin/env node
const { execSync } = require("child_process");

// Récupérer le nom de la branche depuis les arguments
const branchName = process.argv[2];

if (!branchName) {
  console.error("Veuillez fournir un nom de branche");
  console.error("Usage: npm run create-branch <nom-de-branche>");
  process.exit(1);
}

try {
  execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });

  try {
    execSync("git checkout master -- .unlighthouse/*", { stdio: "inherit" });
    execSync("mv .unlighthouse/* ./", { stdio: "inherit" });
    execSync("rm -rf .unlighthouse", { stdio: "inherit" });
    console.log("Contenu de .unlighthouse copié depuis main");
  } catch (error) {
    console.log(
      "Note: Aucun fichier .unlighthouse trouvé dans master, continuation sans copie"
    );
  }

  // Add, commit et push
  execSync("git add .", { stdio: "inherit" });
  execSync(`git commit -m "Initial commit for ${branchName}"`, {
    stdio: "inherit",
  });
  execSync(`git push -u origin ${branchName}`, { stdio: "inherit" });

  console.log(`\nBranche ${branchName} créée et poussée vers GitHub`);
  console.log(
    "Vercel va maintenant déployer automatiquement un environnement de preview"
  );
} catch (error) {
  console.error("Une erreur est survenue:", error.message);
  process.exit(1);
}
