interface Attributes {
	trait_type: string;
	value: string | number;
	display_type?: string;
}

export interface Metadata {
	description: string;
	external_url: string;
	image: string;
	name: string;
	attributes: Attributes[];
}
