interface IBrowser {
    storage: any;
    tabs: any;
    runtime: any;
}

declare var chrome: IBrowser;
declare var browser: IBrowser;
