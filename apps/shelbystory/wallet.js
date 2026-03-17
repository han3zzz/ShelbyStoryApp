import { WalletCore } from "@aptos-labs/wallet-adapter-core";

const walletCore = new WalletCore();

export async function connectPetra(){

  const wallets = walletCore.wallets;

  const petra = wallets.find(
    w => w.name === "Petra"
  );

  if(!petra){
    alert("Petra Wallet not installed");
    return;
  }

  await walletCore.connect(petra.name);

  const account = await walletCore.account();

  console.log("Wallet:", account.address);

  return account.address;
}