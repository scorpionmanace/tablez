---
description: Synchronize README.md with latest component props and types
---

This workflow ensures that the `README.md` file is always up-to-date with the latest interface definitions in `src/lib/types.ts` and `src/lib/core/engine.ts`.

// turbo-all
1. Read the following source files:
   - `src/lib/types.ts`
   - `src/lib/core/engine.ts`

2. Extract the interfaces:
   - `TableProps`
   - `TableSettings`
   - `RowSettings`
   - `Column`
   - `TreeSettings`
   - `ToolbarSettings`
   - `TableTokens`

3. Parse the properties, types, and JSDoc comments/defaults.

4. Update the corresponding tables in `README.md` under the "API" and "Theming" sections.

5. Verify the formatting and ensure no broken markdown.
