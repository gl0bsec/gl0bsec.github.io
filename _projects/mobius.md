---
title: Möbius
description: A local-first framework for portable data apps and transformation pipelines, designed for humans and agents. 
tags: [data-science, agentic-tooling, devOps]
repo: https://github.com/gl0bsec/Mobius-public
order: 99
---

![Möbius banner]({{ '/assets/images/banner2x.png' | relative_url }})

Möbius is an **execution engine and development framework** designed for **humans and agents** turn turning **single-use** analytics pipelines and applications into **auditible, re-usable ones**.

The engine **packages** workflows, applications and their associated runtime specifications into a singlular sharable artifacts, designed with stability and reproducability in mind .

To do so, it abstracts the data ingest and run-time configuration process to a series of plaintext-declared parameters and virtual environments. As a result, it elimiates installation overheads and  JS framework bloat, while improving sharability, stability and result re-producability .  

## How it works: 

When Möbius package is shared with another user, the recipient can author a **binding** that maps the the schema of their dataset (or sets) onto the package's expectations and run it. The engine absorbs the overhead costs of installation and system configuration by assembling a purpose-built virtual environment to the package's own pinned specification.

Workflow results are emitted into a **result bundle**, a single DuckDB file with a generated [Frictionless](https://frictionlessdata.io/) `datapackage.json` containing each result table's inferred schema and the relations between them beside it. Result bundles themselves are valid Möbius inputs, enabling the chaining of workflows and applications.
