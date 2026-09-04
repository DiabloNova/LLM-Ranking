import { testFetcher } from "./fetcher.test";
import { testProviders } from "./providers.test";
import { testRouter } from "./router.test";
import { testHttpProviderLimits } from "./http-provider.test";
import { testPolicyIdentity } from "./policy-identity.test";
import { testSecurity } from "./security.test";
import { testStateMachine } from "./state-machine.test";
import { testUrl } from "./url.test";
// Module-level assertion suite: importing it runs it.
import "./checkout-intent.test";

async function main(): Promise<void> {
  testUrl();
  testPolicyIdentity();
  await testSecurity();
  testStateMachine();
  await testFetcher();
  await testProviders();
  await testRouter();
  await testHttpProviderLimits();
  console.log("✅ acquisition suites passed");
}

main().catch((error: unknown) => {
  console.error("❌ acquisition suite failed", error);
  process.exitCode = 1;
});
