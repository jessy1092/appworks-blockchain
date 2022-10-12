import { useHistory } from 'models/routing';

interface LinkProperty {
	className?: string;

	href: string;
	children: React.ReactNode;
}

const Link: React.FC<LinkProperty> = ({ className, href, children }) => {
	const history = useHistory();

	const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		history.push(href);
	};

	return (
		<a className={className} href={href} onClick={onClick}>
			{children}
		</a>
	);
};

export default Link;
