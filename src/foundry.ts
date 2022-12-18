import prompts from "prompts";
import cliProgress from "cli-progress";
import fs from "fs";
import path from "path";
import https from "https";
import os from "os";
import unzipper from "unzipper";
import chalk from "chalk";

const getFoundryVersionsBase = () => {
    const basePath = path.join(os.homedir(), ".iron");
    if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
    }
    return basePath;
};

export const getFoundryVersions = () => {
    return fs
        .readdirSync(getFoundryVersionsBase(), { withFileTypes: true })
        .filter((path) => path.isDirectory() && path.name !== "data")
        .map((path) => path.name);
};

export const getFoundryLatestVersion = () => {
    return getFoundryVersions().sort().reverse()[0];
};

export const downloadFoundry = async () => {
    const response = await prompts({
        type: "text",
        name: "url",
        message: "Timed URL:",
        validate: (value: string) => {
            if (value.length === 0) {
                return "Please enter a URL";
            }
            if (
                value.startsWith(
                    "https://foundryvtt.s3.amazonaws.com/releases/"
                ) === false
            ) {
                return "Please enter a valid Timed URL";
            }
            try {
                const url = new URL(value);
                const expires = url.searchParams.get("Expires");
                const currentTimestamp = new Date().getTime() / 1000;
                return Number(expires) < currentTimestamp
                    ? "Timed URL has expired"
                    : true;
            } catch (e) {
                return "Please enter a valid URL";
            }
        },
    });
    const foundryVersion = /releases\/([^\/]+)/g.exec(response.url)?.[1] ?? "";
    const progressBar = new cliProgress.SingleBar(
        {},
        cliProgress.Presets.shades_classic
    );

    const foundryArtefact = `FoundryVTT-${foundryVersion}.zip`;

    const foundryArtefactPath = path.join(os.tmpdir(), foundryArtefact);

    const file = fs.createWriteStream(foundryArtefactPath);

    await new Promise<any>((resolve) => {
        https.get(response.url, function (response) {
            if (response.statusCode == 403) {
                throw new Error("Access Denied");
            }
            progressBar.start(
                Number(response.headers["content-length"]) ?? 0,
                0
            );
            response.pipe(file);
            response.on("data", function (chunk) {
                progressBar.increment(chunk.length);
            });
            file.on("finish", function () {
                progressBar.stop();
                file.close(resolve);
            });
        });
    });
    fs.createReadStream(foundryArtefactPath).pipe(
        unzipper.Extract({
            path: path.join(getFoundryVersionsBase(), foundryVersion),
        })
    );
};

export const listFoundryVersions = () => {
    for (const version of getFoundryVersions()) {
        if (version === getFoundryLatestVersion()) {
            console.log(chalk.green.bold(`${version} (latest)`));
        } else {
            console.log(chalk.green(version));
        }
    }
};
