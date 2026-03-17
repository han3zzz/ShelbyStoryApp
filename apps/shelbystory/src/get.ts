import { AccountAddress, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}
if (!process.env.SHELBY_ACCOUNT_ADDRESS) {
  throw new Error("Missing SHELBY_ACCOUNT_ADDRESS");
}

const config = {
  network: Network.TESTNET,
  apiKey: process.env.SHELBY_API_KEY,
};

const shelbyClient = new ShelbyNodeClient(config);

// 2) Parse the account address you'll download from.
//    ⚠️ This should be the *same account* that previously uploaded blobs.
const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);

// 3) Ask Shelby for a list of the account's blobs.
const blobs = await shelbyClient.coordination.getAccountBlobs({ account });

// 4) For each blob, show its metadata.
console.log(`Found ${blobs.length} blob(s)`);

for (const blob of blobs) {
  console.log(
    `· ${blob.blobNameSuffix} — ${blob.size} bytes, expires: ${new Date(blob.expirationMicros / 1000).toISOString()}`,
  );
}
