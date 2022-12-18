#!/usr/bin/env node
import chalk from "chalk";
import { program } from "commander";

const IRON_VERSION = "0.0.1";

program
    .version(IRON_VERSION)
    .description(
        "A powered CLI to improve developer experience for Foundry modules and systems."
    )
    .option("-p, --peppers", "Add peppers")
    .option("-P, --pineapple", "Add pineapple")
    .option("-b, --bbq", "Add bbq sauce")
    .option("-c, --cheese <type>", "Add the specified type of cheese [marble]")
    .option("-C, --no-cheese", "You do not want any cheese")
    .parse(process.argv);


