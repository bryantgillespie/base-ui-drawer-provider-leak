# DrawerProvider keeps unmounted drawers alive

[Open in StackBlitz](https://stackblitz.com/github/bryantgillespie/base-ui-drawer-provider-leak). Open the preview in its own tab so DevTools collects garbage for the app, not the editor.

Or run it locally:

```bash
npm install
npm run dev
```

Then:

1. Click "Mount and unmount 20 pages". Each page holds about 8 MB and renders one closed `Drawer.Root`.
2. In DevTools, open the Memory panel, click "Collect garbage", and wait a second.
3. "Still in memory" stays at every page created.
4. Click "Open and close another drawer", collect garbage again, and the count drops to 0.
5. Open `?provider=0` (same page without `Drawer.Provider`). The count drops to 0 on the first collection.
