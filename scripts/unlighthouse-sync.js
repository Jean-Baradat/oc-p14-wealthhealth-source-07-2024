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

        const targetBranch = "unlighthouse-reports";

        // Check if branch exists
        const branchExists = execSync("git branch --list " + targetBranch)
            .toString()
            .trim();

        if (!branchExists) {
            console.log(`Creating new branch: ${targetBranch}`);
            execSync(`git checkout -b ${targetBranch} master`);
        } else {
            console.log(`Switching to existing branch: ${targetBranch}`);
            execSync(`git checkout ${targetBranch}`);
            // Reset to master to ensure clean state
            execSync("git reset --hard master");
        }

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
        execSync('git commit -m "sync: update unlighthouse reports at root level"');

        // Force push to remote since we're overwriting history
        execSync(`git push -f origin ${targetBranch}`);

        // Return to original branch
        execSync(`git checkout ${currentBranch}`);

        console.log(`✅ Successfully updated ${targetBranch} branch`);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

syncUnlighthouse();
