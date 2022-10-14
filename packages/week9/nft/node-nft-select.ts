import fs from 'fs/promises';

import { Metadata } from './types';

const ARTIST = [
	'Friedrich von Amerling',
	'Christopher Balaska',
	'Quentin Blake',
	'Bartholomeus Strobel',
	'David Begbie',
	'Lisa Keene',
	'Cándido López',
	'Gao Xiang',
	'Amedeo Modigliani',
	'Delphin Enjolras',
];

interface MetadataGroup {
	[id: string]: Metadata;
}

const run = async () => {
	const files = await fs.readdir('./nft/images');

	// console.log('files', files);

	const tmpMetadata: Metadata[] = files.map(file => {
		// '00066-1844022124-a beautiful school building at night, by Christopher Balaska.png';

		const [_, seed, prompt] = file.split('.')[0].split('-');

		return {
			description: 'Next generation art about school',
			external_url: 'https://app-block.pages.dev/appworks/gallery/blind',
			image: `https://pub-a643c8f17c284976bce3b03942a4ef02.r2.dev/images/${encodeURI(file)}`,
			name: 'AppWorks Art NFT',
			attributes: [
				{
					trait_type: 'Artist',
					value: ARTIST.filter(artist => prompt.includes(artist))[0],
				},
				{
					trait_type: 'Prompt',
					value: prompt,
				},
				{
					display_type: 'number',
					trait_type: 'Seed',
					value: parseInt(seed, 10),
				},
			],
		};
	});

	const randomMetadata: Metadata[] = [];
	const totalImage = tmpMetadata.length;

	for (let i = 0; i < totalImage; i++) {
		const pickIndex = Math.floor(Math.random() * tmpMetadata.length);

		const pickMetadata = tmpMetadata.splice(pickIndex, 1);

		// console.log(pickMetadata);

		randomMetadata.push({
			...pickMetadata[0],
			external_url: `https://app-block.pages.dev/appworks/gallery/${i + 1}`,
			name: `AppWorks Art NFT#${i + 1}`,
		});
	}

	await Promise.all(
		randomMetadata.map((metadata, index) =>
			fs.writeFile(`./nft/metadata/${index + 1}`, JSON.stringify(metadata, null, '  ')),
		),
	);
};

run();
