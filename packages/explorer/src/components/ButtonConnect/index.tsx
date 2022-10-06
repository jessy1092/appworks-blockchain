interface ButtonConnectProperty {
	className?: string;
	address: string;
	connect: () => void;
}

const ButtonConnect: React.FC<ButtonConnectProperty> = ({ className, address, connect }) => (
	<>
		{address === '' ? (
			<button className={className} onClick={connect}>
				Connect MetaMask
			</button>
		) : (
			<div className={className}>Wallet: {address}</div>
		)}
	</>
);

export default ButtonConnect;
