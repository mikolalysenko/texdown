#!/usr/bin/env node
require("../texdown.js")(process.stdin).pipe(process.stdout);