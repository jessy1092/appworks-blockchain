import {
	useState,
	useEffect,
	useMemo,
	lazy,
	useRef,
	FC,
	ReactElement,
	ComponentType,
	useCallback,
} from 'react';
import UniversalRouter, { RouterOptions, RouteContext, Route } from 'universal-router';
import { History } from 'history';
import { Store } from 'redux';

import { routeChange } from 'models/routing';
import { State } from 'models/reducers';
import useLocation from 'models/routing/hook';

export interface CustomRouteContext extends RouteContext {
	history: History;
	store: Store<State>;
}

export interface CustomRoute extends Route {
	onEnter?: (R: CustomRouteContext) => Promise<ReactElement | boolean | void | undefined>;
	components: () => Promise<{ default: ComponentType }>[];
	render: (C: FC[], R: ReactElement) => ReactElement;
	children?: CustomRoute[];
}

const options: RouterOptions = {
	baseUrl: '',
	async resolveRoute(ctx) {
		const route = ctx.route as CustomRoute;
		const { next } = ctx;

		let children;

		if (typeof route.onEnter === 'function') {
			children = await route.onEnter(ctx as CustomRouteContext);
		}

		// Do not Enter children
		if (children === false) {
			return null;
		}

		if (typeof children === 'undefined') {
			children = await next();
		}

		// Skip routes without render() function
		if (!route.render) {
			return null;
		}

		// Start downloading missing JavaScript chunks
		const components = route.components
			? route.components().map(component => lazy(() => component))
			: [];

		const result = route.render(components, children);

		return result;
	},
	errorHandler(error, context) {
		console.info('errorHandler: ', error, context);
		return error.status === 404 ? '<h1>Page Not Found</h1>' : '<h1>Oops! Something went wrong</h1>';
	},
};

interface useRouterReturnType {
	loading: boolean;
	component: ReactElement | null;
}

const useRouter = (routes: CustomRoute, history: History, store: Store): useRouterReturnType => {
	const location = useLocation(history);
	const router = useMemo(() => new UniversalRouter(routes, options), [routes]);
	const [Component, setComponent] = useState({ loading: false, component: null });

	// Referrence the route index
	const lastIndex = useRef(0);

	const asyncLocationChange = useCallback(async () => {
		setComponent(prevComponent => ({ ...prevComponent, loading: true }));
		lastIndex.current += 1;

		// Use function scope to index current change route
		const index = lastIndex.current;

		const LazyComponent = await router.resolve({
			pathname: location.pathname,
			history,
			store,
		});

		// Detect the latest change index for prevent updating the wrong route view
		if (index === lastIndex.current) {
			setComponent({ loading: false, component: LazyComponent });
		}
	}, [history, location.pathname, router, store]);

	useEffect(() => {
		asyncLocationChange();
	}, [asyncLocationChange]);

	useEffect(() => {
		store.dispatch(routeChange(location));
	}, [location, store]);

	return Component;
};

export default useRouter;
