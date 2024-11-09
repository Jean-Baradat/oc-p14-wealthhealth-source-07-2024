const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

async function syncUnlighthouse() {
  try {
    // Check for uncommitted changes
    const status = execSync("git status --porcelain").toString();
    if (status) {
      console.error(
        "❌ You have uncommitted changes. Please commit or stash them first."
      );
      console.error("Changes detected:");
      console.error(execSync("git status").toString());
      process.exit(1);
    }

    // Store current branch name
    const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim();

    // Create and checkout new branch
    const newBranchName = `unlighthouse-sync-${Date.now()}`;
    execSync(`git checkout -b ${newBranchName} master`);

    // Remove everything except .unlighthouse
    execSync("git rm -rf .");
    execSync("git checkout master -- .gitignore");

    // Generate Unlighthouse report
    console.log("📊 Generating Unlighthouse report...");
    execSync(
      "unlighthouse-ci --site https://oc-p14-wealthhealth-source-07-2024.vercel.app/ --build-static",
      { stdio: "inherit" }
    );

    // Move content from .unlighthouse to root
    const unlighthousePath = path.join(process.cwd(), ".unlighthouse");
    const files = fs.readdirSync(unlighthousePath);

    files.forEach((file) => {
      fs.moveSync(
        path.join(unlighthousePath, file),
        path.join(process.cwd(), file),
        { overwrite: true }
      );
    });

    // Remove empty .unlighthouse directory
    fs.rmdirSync(".unlighthouse");

    // Commit changes
    execSync("git add .");
    execSync('git commit -m "sync: update unlighthouse reports"');

    // Push to remote
    execSync(`git push origin ${newBranchName}`);

    // Return to original branch
    execSync(`git checkout ${currentBranch}`);

    console.log(`✅ Successfully created and pushed branch: ${newBranchName}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

syncUnlighthouse();
