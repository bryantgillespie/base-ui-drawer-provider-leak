import { Drawer } from "@base-ui/react/drawer";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

// Each page owns ~8 MB. A FinalizationRegistry counts how many have been garbage collected.
const counts = { created: 0, collected: 0 };
const registry = new FinalizationRegistry<number>(() => {
	counts.collected += 1;
});

function Page({ id }: { id: number }) {
	const [payload] = React.useState(() => {
		const data = new Float64Array(1_000_000);
		counts.created += 1;
		registry.register(data, id);
		return data;
	});
	return (
		<section>
			<p>
				Page {id} ({payload.length.toLocaleString()} numbers)
			</p>
			{/* Never opened. Its callback closes over the page's data, as real handlers do. */}
			<Drawer.Root onOpenChange={(open) => console.log(open, payload.length)}>
				<Drawer.Trigger>Row actions</Drawer.Trigger>
				<Drawer.Portal>
					<Drawer.Popup>Actions for page {id}</Drawer.Popup>
				</Drawer.Portal>
			</Drawer.Root>
		</section>
	);
}

function App() {
	const [page, setPage] = React.useState<number | null>(null);
	const [, refresh] = React.useReducer((n: number) => n + 1, 0);

	React.useEffect(() => {
		const timer = setInterval(refresh, 500);
		return () => clearInterval(timer);
	}, []);

	function cyclePages() {
		const start = counts.created;
		for (let id = start + 1; id <= start + 20; id += 1) {
			flushSync(() => setPage(id));
			flushSync(() => setPage(null));
		}
	}

	return (
		<main style={{ fontFamily: "system-ui", padding: 24, lineHeight: 1.6 }}>
			<h1>DrawerProvider keeps unmounted drawers alive</h1>
			<p>
				<strong>{withProvider ? "With Drawer.Provider" : "Without Drawer.Provider"}</strong>
			</p>
			<ol>
				<li>Click "Mount and unmount 20 pages".</li>
				<li>DevTools, Memory panel: click "Collect garbage" (trash can icon), then wait a second.</li>
				<li>
					With the provider, "still in memory" stays at every page created. Click "Open and close
					another drawer", collect garbage again, and they are released.
				</li>
				<li>
					{withProvider ? (
						<>
							Compare with <a href="?provider=0">the same page without Drawer.Provider</a>.
						</>
					) : (
						<>
							You are on the page without Drawer.Provider.{" "}
							<a href="?">Back to the page with it</a>.
						</>
					)}
				</li>
			</ol>
			<button type="button" onClick={cyclePages}>
				Mount and unmount 20 pages
			</button>{" "}
			<UnrelatedDrawer />
			<p>
				Pages created: <strong>{counts.created}</strong>. Still in memory:{" "}
				<strong data-testid="retained">{counts.created - counts.collected}</strong> (about{" "}
				{(counts.created - counts.collected) * 8} MB).
			</p>
			{page === null ? null : <Page key={page} id={page} />}
		</main>
	);
}

function UnrelatedDrawer() {
	return (
		<Drawer.Root>
			<Drawer.Trigger>Open and close another drawer</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Backdrop />
				<Drawer.Popup style={{ position: "fixed", inset: "auto 0 0 0", background: "white", padding: 24 }}>
					<Drawer.Close>Close</Drawer.Close>
				</Drawer.Popup>
			</Drawer.Portal>
		</Drawer.Root>
	);
}

const withProvider = new URLSearchParams(location.search).get("provider") !== "0";
const app = <App />;
createRoot(document.getElementById("root")!).render(
	<React.StrictMode>{withProvider ? <Drawer.Provider>{app}</Drawer.Provider> : app}</React.StrictMode>,
);
