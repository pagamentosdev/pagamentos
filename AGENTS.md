# pagamentos.dev

pagamentos.dev is a unified SDK for payments in Brazil.

## Commands

- `bun run check`: Check lint issues.
- `bun run fix`: Fix (auto-fixable) lint issues.
- `bun run ./clone-repos`: Clone repos for `.context` folder

## .context

The `/.context` directory contains the source code for auxiliary libraries that
serve as a reference or foundation for development. Consult these
implementations to ensure consistency with the existing ecosystem.

## internal

Please refer to the documentation in the `/internal` folder before making
architectural decisions. The DESIGN.md file is especially important, as it
outlines the core API design and structural requirements for the SDK.

After finalizing changes in the internal design, remember to update this
document to reflect the latest architecture and design principles.
