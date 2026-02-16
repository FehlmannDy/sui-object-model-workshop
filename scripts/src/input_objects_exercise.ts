import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import keyPairJson from "../keypair.json" with { type: "json" };
import { Transaction } from '@mysten/sui/transactions';

/**
 *
 * Global variables
 *
 * These variables are used throughout the exercise below.
 *
 */
const PACKAGE_ID = `0xb3491c9657444a947c97d7eeccff0d4988b432f8a37e7f9a26fb6ed4fbc3df9a`;
const COUNTER_OBJECT_ID = `0x8a6f2bc3af32c71a93a35d397fd47c14f67b7aa252002c907df9b172e95c0ec6`;

const keypair = Ed25519Keypair.fromSecretKey(keyPairJson.privateKey);

const suiClient = new SuiGrpcClient({
	network: 'testnet',
	baseUrl: 'https://fullnode.testnet.sui.io:443',
});

/**
 * Objects as input: Exercise 1
 *
 * In this exercise, you use Sui objects as inputs in a PTB to update the value of a shared object.
 *
 * When finished, run the following command in the scripts directory to test your solution:
 *
 * pnpm input-objects
 *
 * RESOURCES:
 * - https://sdk.mystenlabs.com/typescript/transaction-building/basics#transactions
 */
const main = async () => {
  /**
   * Task 1:
   *
   * Create a new Transaction instance from the @mysten/sui/transactions module.
   */

  const tx = new Transaction();

  /**
   * Task 2:
   *
   * Create a coin to pay the fee for incrementing the counter.
   * Based on the counter.move file, we need to provide a SUI coin with at least the minimum fee (10).
   * We use the `splitCoins` function to create a coin with the minimum fee from our gas fee.
   *
   * Resources:
   * - SplitCoins: https://sdk.mystenlabs.com/typescript/transaction-building/basics
   */

  const feeCoin = tx.splitCoins(tx.gas, [tx.pure.u64(10)])[0];

  /**
   * Task 3:
   *
   * Execute the call to the `counter::increment` function to the transaction instance.
   *
   * The target should be in the format {package address}::{module name}::{function name}. The
   * package address is provided above. The module name is `counter` and the function name is
   * `increment`.
   *
   * Resources:
   * - Object inputs: https://sdk.mystenlabs.com/typescript/transaction-building/basics#object-references
   */

  tx.moveCall({
    target: `${PACKAGE_ID}::counter::increment`,
    arguments: [
      tx.object(COUNTER_OBJECT_ID),
      feeCoin,
    ],
  });
  /**
   * Task 4:
   *
   * Sign and execute the transaction using the SuiClient instance created above.
   *
   * Print the result to the console.
   *
   * Resources:
   * - Observing transaction results: https://sdk.mystenlabs.com/typescript/transaction-building/basics#observing-the-results-of-a-transaction
   */

    const result = await suiClient.core.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    include: { effects: true, events: true }
  })

  console.log(JSON.stringify(result, null, 2));
  
  if (result.FailedTransaction) {
    throw new Error(`Transaction failed: ${result.FailedTransaction.status.error}`);
  }

  console.log("Digest is:", result.Transaction?.digest);

  /**
   * Task 5: Run the script with the command below and ensure it works!
   * 
   * pnpm input-objects
   * 
   * Verify the transaction on the Sui Explorer: https://suiscan.xyz/testnet/home
   */
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});