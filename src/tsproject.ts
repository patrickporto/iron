import path from "path";
import fs from "fs";
import {
    FoundryManifest,
    getManifest,
    IronConfig,
    saveManifest,
} from "./project.js";
import { spawn } from "child_process";
import { MAIN_SCRIPT } from "./structures.js";

export const createTSConfig = (ironConfig: IronConfig) => {
    const tsconfigPath = path.join(ironConfig.rootPath, "tsconfig.json");
    if (!fs.existsSync(tsconfigPath)) {
        const tsconfig = {
            compilerOptions: {
                target: "es2016",
                rootDir: "src",
                outDir: "dist",
                moduleResolution: "node",
                sourceMap: true,
                esModuleInterop: true,
                strict: true,
                skipLibCheck: true,
                strictNullChecks: true,
                types: ["@league-of-foundry-developers/foundry-vtt-types"],
            },
        };
        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 4));
    }
};

export const createPkg = async (
    manifest: FoundryManifest,
    projectRoot: string
) => {
    const pkgPath = path.join(projectRoot, "package.json");
    if (!fs.existsSync(pkgPath)) {
        const pkg = {
            name: manifest.id,
            version: manifest.version,
            private: true,
            scripts: {
                build: "npx tsc",
            },
            devDependencies: {
                typescript: "^4.9.4",
                "@league-of-foundry-developers/foundry-vtt-types":
                    "git://github.com/League-of-Foundry-Developers/foundry-vtt-types.git#main",
            },
        };

        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4));
    }
};

export const installDependencies = async (projectRoot: string) => {
    return new Promise<void>((resolve) => {
        const foundry = spawn("npm", ["install", "--prefix", projectRoot]);
        foundry.stdout.on("data", function (data) {
            process.stdout.write(data.toString());
        });

        foundry.stderr.on("data", function (data) {
            process.stdout.write(data.toString());
        });

        foundry.on("exit", function (code) {
            resolve();
        });
    });
};

export const tsc = async (projectRoot: string) => {
    return new Promise<void>((resolve) => {
        const foundry = spawn("npm", ["run", "build", "--prefix", projectRoot]);
        foundry.stdout.on("data", function (data) {
            process.stdout.write(data.toString());
        });

        foundry.stderr.on("data", function (data) {
            process.stdout.write(data.toString());
        });

        foundry.on("exit", function (code) {
            resolve();
        });
    });
};

export const createTSMainScript = async (ironConfig: IronConfig) => {
    const mainPath = path.join(ironConfig.rootPath, "src", "main.ts");
    if (!fs.existsSync(mainPath)) {
        fs.mkdirSync(path.dirname(mainPath), { recursive: true });
        fs.writeFileSync(mainPath, MAIN_SCRIPT);
        const manifest = await getManifest(ironConfig);
        if (!manifest.esmodules) {
            manifest.esmodules = [];
        }
        manifest.esmodules.push("main.js");
        saveManifest(ironConfig, manifest);
    }
};
