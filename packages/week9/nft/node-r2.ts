import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

import S3 from 'aws-sdk/clients/s3';

const accountid = process.env.R2_ACCOUNT_ID;
const access_key_id = process.env.R2_ACCESS_KEY;
const access_key_secret = process.env.R2_ACCESS_KEY_SECRET;

const s3 = new S3({
	endpoint: `https://${accountid}.r2.cloudflarestorage.com`,
	accessKeyId: `${access_key_id}`,
	secretAccessKey: `${access_key_secret}`,
	signatureVersion: 'v4',
});

const run = async () => {
	console.log(await s3.listBuckets().promise());

	/* The following example enables PUT, POST, and DELETE requests from www.example.com, and enables GET requests from any domain. */
	const params = {
		Bucket: 'app-block',
		CORSConfiguration: {
			CORSRules: [
				// {
				// 	AllowedHeaders: ['*'],
				// 	AllowedMethods: ['PUT', 'POST', 'DELETE'],
				// 	AllowedOrigins: ['http://www.example.com'],
				// 	ExposeHeaders: ['x-amz-server-side-encryption'],
				// 	MaxAgeSeconds: 3000,
				// },
				{
					AllowedMethods: ['GET'],
					AllowedOrigins: ['*'],
				},
			],
		},
	};
	console.log(await s3.putBucketCors(params).promise());
};

run();
