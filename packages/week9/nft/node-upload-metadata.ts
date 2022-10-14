import S3 from 'aws-sdk/clients/s3';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config({ path: '.env' });

const accountid = process.env.R2_ACCOUNT_ID;
const access_key_id = process.env.R2_ACCESS_KEY;
const access_key_secret = process.env.R2_ACCESS_KEY_SECRET;

const s3 = new S3({
	endpoint: `https://${accountid}.r2.cloudflarestorage.com`,
	accessKeyId: `${access_key_id}`,
	secretAccessKey: `${access_key_secret}`,
	signatureVersion: 'v4',
});

const uploadMetadata = async (tokenId: string) => {
	const data = await fs.readFile(`./nft/metadata/${tokenId}`);

	const params = {
		Body: data,
		Bucket: 'app-block',
		Key: `metadata/${tokenId}`,
		ContentType: 'application/json',
	};

	console.log(await s3.putObject(params).promise());
};

const run = async () => {
	// uploadMetadata('blind');

	const promises = [];

	for (let i = 1; i <= 32; i++) {
		promises.push(uploadMetadata(`${i}`));
	}

	await Promise.all(promises);
};

run();
