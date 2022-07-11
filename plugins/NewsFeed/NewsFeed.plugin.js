//META{"name":"DateViewer","displayName":"Date Viewer","website":"https://github.com/hammy1/BDStuff/tree/master/Plugins/dateViewer","source":"https://raw.githubusercontent.com/hammy1/BDStuff/master/Plugins/dateViewer/dateViewer.plugin.js"}*//

var DateViewer = (() => {
	const config = { "info": { "name": "Date Viewer", "authors": [{ "name": "hammy", "discord_id": "256531049222242304", "github_username": "hammy1" }], "version": "0.2.5", "description": "Displays current time, date and day of the week on your right side. The way it's displayed depends on your locale conventions.", "github": "https://github.com/hammy1/BDStuff/tree/master/Plugins/dateViewer", "github_raw": "https://raw.githubusercontent.com/hammy1/BDStuff/master/Plugins/dateViewer/dateViewer.plugin.js" }, "changelog": [{ "title": "Bugs Squashed!", "type": "fixed", "items": ["Actually renders in the memberlist again. But this time properly positioned."] }, { "title": "Improvements!", "type": "improved", "items": ["Now uses discords css variables."] }], "main": "index.js" };

	return !global.ZeresPluginLibrary ? class {
		getName() { return config.info.name; }
		getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
		getDescription() { return config.info.description; }
		getVersion() { return config.info.version; }
		load() { window.BdApi.alert("Library Missing", `The library plugin needed for ${config.info.name} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`); }
		start() { }
		stop() { }
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
			const { PluginUtilities, DiscordSelectors, WebpackModules, DiscordModules, Patcher, ReactTools } = Api;
			const Lists = WebpackModules.getByProps("ListThin");

			const ErrorBoundary = class ErrorBoundary extends DiscordModules.React.Component {
				constructor(props) {
					super(props);
					this.state = { hasError: false };
				}

				static getDerivedStateFromError(error) {
					return { hasError: true };
				}

				componentDidCatch(error, info) {
					console.error(`[${config.info.name}|Error]`, error);
				}

				render() {
					if (this.state.hasError) return DiscordModules.React.createElement('div', { className: 'react-error' }, 'Component Error!');
					return this.props.children;
				}
			};

			const WrapBoundary = (Original) => {
				return class Boundary extends DiscordModules.React.Component {
					render() {
						return DiscordModules.React.createElement(ErrorBoundary, null, DiscordModules.React.createElement(Original, this.props));
					}
				};
			};

			const Viewer = class Viewer extends DiscordModules.React.Component {
				constructor(props) {
					super(props);
					this.interval;
					this.state = { time: "", date: "", weekday: "" };
					this.update = this.update.bind(this);
				}

				componentDidMount() {
					this.update();
					this.interval = setInterval(() => this.update(), 1000);
				}

				componentWillUnmount() {
					clearInterval(this.interval);
				}

				update() {
					const date = new Date();
					const lang = document.documentElement.lang;
					this.setState({
						time: date.toLocaleTimeString(lang),
						date: date.toLocaleDateString(lang, { day: "2-digit", month: "2-digit", year: "numeric" }),
						weekday: date.toLocaleDateString(lang, { weekday: "long" })
					});
				}

				render() {
					if (!DiscordModules.SelectedGuildStore.getGuildId()) return null;
					return DiscordModules.React.createElement("div", {
						id: "dv-mount"
					},
						DiscordModules.React.createElement("div", {
							id: "dv-main"
						},
							DiscordModules.React.createElement("span", {
								className: "dv-time"
							}, this.state.time),
							DiscordModules.React.createElement("span", {
								className: "dv-date"
							}, this.state.date),
							DiscordModules.React.createElement("span", {
								className: "dv-weekday"
							}, this.state.weekday)
						)
					);
				}
			}

			return class DateViewer extends Plugin {
				constructor() {
					super();
					this.initialized = false;
					console.log(DiscordSelectors);
					this.style = `
				#dv-mount {
					background-color: var(--background-secondary);
					bottom: 0;
					box-sizing: border-box;
					display: flex;
					height: 95px;
					justify-content: center;
					position: absolute;
					width: 240px;
				}
				#dv-main {
					border-top: 1px solid var(--background-modifier-accent);
					box-sizing: border-box;
					color: var(--text-normal);
					display: flex;
					flex-direction: column;
					height: 100%;
					line-height: 20px;
					justify-content: center;
					text-align: center;
					text-transform: uppercase;
					width: calc(100% - 40px);
				}
				#dv-main .dv-date {
					font-size: small;
					opacity: 0.6;
				}
				${DiscordSelectors.MemberList.membersWrap} ${DiscordSelectors.MemberList.members}{
					height: calc(100% - 95px);
				}
			`;
				}

				onStart() {
					PluginUtilities.addStyle(this.getName() + "-style", this.style);
					this.patchMemberList();
					this.initialized = true;
				}

				onStop() {
					PluginUtilities.removeStyle(this.getName() + "-style");
					Patcher.unpatchAll();
					this.updateMemberList();
				}

				patchMemberList() {
					if (!Lists) return;

					Patcher.after(Lists.ListThin, "render", (that, args, value) => {
						const props = this.getProps(value, "props");
						if (!props || !props.id || !props.id.startsWith("members")) return value;

						const viewer = DiscordModules.React.createElement(WrapBoundary(Viewer), {});
						const fn = (item) => item && item.type && item.type.displayName && item.type.displayName === "Viewer";

						if (!Array.isArray(value) || value.some(fn)) return [value, viewer].flat().filter(n => n)

						return value;
					});

					this.updateMemberList();
				}

				updateMemberList() {
					const memberList = document.querySelector(DiscordSelectors.MemberList.members.value.trim());
					if (memberList) ReactTools.getOwnerInstance(memberList).forceUpdate();
				}

				getProps(obj, path) {
					return path.split(/\s?\.\s?/).reduce((object, prop) => object && object[prop], obj);
				}
			}
		}
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();

module.exports = DateViewer;
