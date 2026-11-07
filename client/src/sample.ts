export const SAMPLE_DIFF = `diff --git a/src/auth.ts b/src/auth.ts
index 1234567..abcdefg 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,7 +10,10 @@ export function login(user: string, password: string) {
   if (!user || !password) {
     throw new Error("missing credentials");
   }
-  return db.findUser(user);
+  const found = db.findUser(user);
+  if (found && found.password === password) {
+    return found;
+  }
+  return null;
 }
`;
