// tsup.config.ts
import { defineConfig } from "tsup";
var tsup_config_default = defineConfig([
  {
    entry: ["./src/index.ts"],
    format: ["esm", "cjs"],
    platform: "node",
    target: "node14",
    dts: true
  },
  {
    entry: ["./src/entry-standalone.ts", "./src/entry-middleware-with-sirv.ts"],
    format: ["esm"],
    platform: "node",
    target: "esnext",
    shims: false,
    external: ["@vavite/connect/handler", "@vavite/connect/user-handler"]
  },
  {
    entry: {
      "entry-middleware-with-external-sirv": "./src/entry-middleware-with-sirv.ts"
    },
    format: ["esm"],
    platform: "node",
    target: "esnext",
    shims: false,
    external: [
      "@vavite/connect/handler",
      "@vavite/connect/user-handler",
      "sirv"
    ]
  }
]);
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ0c3VwXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhbXG5cdHtcblx0XHRlbnRyeTogW1wiLi9zcmMvaW5kZXgudHNcIl0sXG5cdFx0Zm9ybWF0OiBbXCJlc21cIiwgXCJjanNcIl0sXG5cdFx0cGxhdGZvcm06IFwibm9kZVwiLFxuXHRcdHRhcmdldDogXCJub2RlMTRcIixcblx0XHRkdHM6IHRydWUsXG5cdH0sXG5cdHtcblx0XHRlbnRyeTogW1wiLi9zcmMvZW50cnktc3RhbmRhbG9uZS50c1wiLCBcIi4vc3JjL2VudHJ5LW1pZGRsZXdhcmUtd2l0aC1zaXJ2LnRzXCJdLFxuXHRcdGZvcm1hdDogW1wiZXNtXCJdLFxuXHRcdHBsYXRmb3JtOiBcIm5vZGVcIixcblx0XHR0YXJnZXQ6IFwiZXNuZXh0XCIsXG5cdFx0c2hpbXM6IGZhbHNlLFxuXHRcdGV4dGVybmFsOiBbXCJAdmF2aXRlL2Nvbm5lY3QvaGFuZGxlclwiLCBcIkB2YXZpdGUvY29ubmVjdC91c2VyLWhhbmRsZXJcIl0sXG5cdH0sXG5cdHtcblx0XHRlbnRyeToge1xuXHRcdFx0XCJlbnRyeS1taWRkbGV3YXJlLXdpdGgtZXh0ZXJuYWwtc2lydlwiOlxuXHRcdFx0XHRcIi4vc3JjL2VudHJ5LW1pZGRsZXdhcmUtd2l0aC1zaXJ2LnRzXCIsXG5cdFx0fSxcblx0XHRmb3JtYXQ6IFtcImVzbVwiXSxcblx0XHRwbGF0Zm9ybTogXCJub2RlXCIsXG5cdFx0dGFyZ2V0OiBcImVzbmV4dFwiLFxuXHRcdHNoaW1zOiBmYWxzZSxcblx0XHRleHRlcm5hbDogW1xuXHRcdFx0XCJAdmF2aXRlL2Nvbm5lY3QvaGFuZGxlclwiLFxuXHRcdFx0XCJAdmF2aXRlL2Nvbm5lY3QvdXNlci1oYW5kbGVyXCIsXG5cdFx0XHRcInNpcnZcIixcblx0XHRdLFxuXHR9LFxuXSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUE7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMzQjtBQUFBLElBQ0MsT0FBTyxDQUFDO0FBQUEsSUFDUixRQUFRLENBQUMsT0FBTztBQUFBLElBQ2hCLFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSLEtBQUs7QUFBQTtBQUFBLEVBRU47QUFBQSxJQUNDLE9BQU8sQ0FBQyw2QkFBNkI7QUFBQSxJQUNyQyxRQUFRLENBQUM7QUFBQSxJQUNULFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSLE9BQU87QUFBQSxJQUNQLFVBQVUsQ0FBQywyQkFBMkI7QUFBQTtBQUFBLEVBRXZDO0FBQUEsSUFDQyxPQUFPO0FBQUEsTUFDTix1Q0FDQztBQUFBO0FBQUEsSUFFRixRQUFRLENBQUM7QUFBQSxJQUNULFVBQVU7QUFBQSxJQUNWLFFBQVE7QUFBQSxJQUNSLE9BQU87QUFBQSxJQUNQLFVBQVU7QUFBQSxNQUNUO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQTtBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
