import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import keyPairJson from '../keypair.json' with { type: 'json' };
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';

const keypair = Ed25519Keypair.fromSecretKey(keyPairJson.privateKey);

const PACKAGE_ID =
	'0x9603a31f4b3f32843b819b8ed85a5dd3929bf1919c6693465ad7468f9788ef39';
const VAULT_ID =
	'0x8d85d37761d2a4e391c1b547c033eb0e22eb5b825820cbcc0c386b8ecb22be33';

const suiClient = new SuiGrpcClient({
	network: 'testnet',
	baseUrl: 'https://fullnode.testnet.sui.io:443',
});

const main = async () => {
	const sender = keypair.toSuiAddress();

	// Task 1: Create a new Transaction
	const tx = new Transaction();
	tx.setSender(sender);

	// Task 2: Create a new key using key::new()
	const [keyObj] = tx.moveCall({
		target: `${PACKAGE_ID}::key::new`,
		arguments: [],
	});

	// Task 3: Set the key code correctly using key::set_code(&mut Key, u64)
	// Code from the on-chain vault object: 745223
	tx.moveCall({
		target: `${PACKAGE_ID}::key::set_code`,
		arguments: [keyObj, tx.pure.u64(745223)],
	});

	// Task 4: Use the key to withdraw the SUI coin from the vault using
	// vault::withdraw<T>(&mut Vault<T>, Key, &mut TxContext): Coin<T>
	const [withdrawnCoin] = tx.moveCall({
		target: `${PACKAGE_ID}::vault::withdraw`,
		typeArguments: ['0x2::sui::SUI'],
		arguments: [
			tx.object(VAULT_ID), // &mut Vault<SUI>
			keyObj,              // Key (by value, will be consumed)
			// TxContext is implicit; do NOT pass it
		],
	});

	// Task 5: Transfer the SUI coin to your account
	tx.transferObjects([withdrawnCoin], tx.pure.address(sender));

	// Task 6: Sign and execute the transaction using the SuiGrpcClient
	const result = await suiClient.core.signAndExecuteTransaction({
		transaction: tx,
		signer: keypair,
		include: {
			effects: true,
			objectChanges: true,
		},
	});

	if (result.FailedTransaction) {
		throw new Error(
			`Transaction failed: ${
				result.FailedTransaction.status.error ?? 'Unknown error'
			}`,
		);
	}

	console.log('Digest:', result.Transaction.digest);
	console.dir(result.Transaction.effects, { depth: null });
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});