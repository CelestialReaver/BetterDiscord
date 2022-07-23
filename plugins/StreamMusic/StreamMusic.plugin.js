/**
 * @name StreamMusic
 * @author CelestialReaver
 * @authorId 859547769798656001
 * @version 0.0.1
 * @invite 0Tmfo5ZbORCRqbAd
 * @description Stream music in the background while you Discord.
 * @website https://celestialreaver.github.io/
 * @source https://github.com/CelestialReaver/BetterDiscord/tree/main/plugins/StreamMusic
 * @updateUrl https://raw.githubusercontent.com/CelestialReaver/BetterDiscord/main/plugins/StreamMusic/StreamMusic.plugin.js
 */
/*@cc_on
@if (@_jscript)
    
    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
    var pathSelf = WScript.ScriptFullName;
    // Put the user at ease by addressing them in the first person
    shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
    if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
        shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
    } else if (!fs.FolderExists(pathPlugins)) {
        shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
    } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
        fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
        // Show the user where to put plugins in the future
        shell.Exec("explorer " + pathPlugins);
        shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
    }
    WScript.Quit();

@else@*/

module.exports = (() => {
	const config = {
		info: {
			name: "StreamMusic",
			authors: [
				{
					name: "CelestialReaver",
					discord_id: "859547769798656001",
					github_username: "CelestialReaver",
				},
			],
			version: "0.0.1",
			description: "Stream music in the background while you Discord.",
			github:
				"https://github.com/CelestialReaver/BetterDiscord/tree/main/plugins/StreamMusic",
			/*github_raw:
			"https://raw.githubusercontent.com/CelestialReaver/BetterDiscord/main/plugins/StreamMusic/StreamMusic.plugin.js",*/
		},
		changelog: [
			{
				title: "v0.0.1",
				type: "release",
				items: ["Initial release."],
			},
			/* Future release notes go below.*/
			/*{
			title: "v0.0.2",
			items: ["Update notes here."]
		},*/
		],
		main: "StreamMusic.plugin.js",
	};
	return !global.ZeresPluginLibrary
		? class {
			constructor() {
				this._config = config;
			}
			getName() {
				return config.info.name;
			}
			getAuthor() {
				return config.info.authors.map((a) => a.name).join(", ");
			}
			getDescription() {
				return config.info.description;
			}
			getVersion() {
				return config.info.version;
			}
			load() {
				try {
					global.ZeresPluginLibrary.PluginUpdater.checkForUpdate(
						config.info.name,
						config.info.version
						/*config.info.github_raw*/
					);
				} catch (err) {
					console.error(
						this.getName(),
						"Plugin updater could not be reached.",
						err
					);
				}
				BdApi.showConfirmationModal(
					"Library Missing",
					`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
					{
						confirmText: "Download Now",
						cancelText: "Cancel",
						onConfirm: () => {
							require("request").get(
								"https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
								async (error, response, body) => {
									if (error) {
										return BdApi.showConfirmationModal("Error Downloading", [
											"Library plugin download failed. Manually install the plugin library from the link below.",
											BdApi.React.createElement(
												"a",
												{
													href: "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
													target: "_blank",
												},
												"Plugin Link"
											),
										]);
									}
									await new Promise((r) =>
										require("fs").writeFile(
											require("path").join(
												BdApi.Plugins.folder,
												"0PluginLibrary.plugin.js"
											),
											body,
											r
										)
									);
								}
							);
						},
					}
				);
			}
			start() { }
			stop() { }
		}
		: (([Plugin, Library]) => {
			const { Toasts, Logger, Patcher, Settings, Utilities, ReactTools, DOMTools, DiscordModules, WebpackModules, DiscordSelectors, PluginUtilities } = Library;
			const selectedMusic ="https://github.com/CelestialReaver/BetterDiscord/blob/main/plugins/StreamMusic/assets/synthwave.mp3?raw=true";
			const playlist = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1457406223&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false";
			
			return class StreamMusic extends Plugin {
				start() {
					this.volume = BdApi.loadData(config.info.name, "volume") ?? 0.25;
					this.music = BdApi.loadData(config.info.name, "music") ?? selectedMusic;
					window.sm = new Audio(this.music);
					window.sm.pause();
					window.sm.loop = true;
					window.sm.volume = this.volume;
					window.sm.play();
					Toasts.info(`${config.info.name} ${config.info.version} has started!`, { timeout: 2e3 });
				}
				currentMusic() {
					window.sm.pause();
					window.sm = new Audio(this.music === "" ? selectedMusic : this.music);
					window.sm.pause();
					window.sm.loop = true;
					window.sm.volume = this.volume;
					window.sm.play();
				}
				stop() {
					window.sm.pause();
					Toasts.info(`${config.info.name} ${config.info.version} has stopped!`, { timeout: 2e3 });
				}
				getSettingsPanel() {
					return Settings.SettingPanel.build(this.saveSettings.bind(this),
							new Settings.Slider(
									"Volume",
									"Volume control for StreamMusic.",
									0,
									1,
									this.volume,
									(e) => {
										this.volume = e;
										window.sm.volume = this.volume;
									},
								),
								new Settings.Textbox(
									"Music",
									"Put the URL of music you'd like to play. Leave blank for default music.",
									this.music !== selectedMusic ? this.music : null,
									(e, d) => {
										this.music = e;
										this.currentMusic();
									},
									{
										placeholder:
											"Paste the URL of the music you'd like to play here.",
									}
								),
					)								
				}
				saveSettings() {
					BdApi.saveData(config.info.name, "volume", this.volume);
					BdApi.saveData(config.info.name, "music", this.music);
				}
		};
			return plugin(Plugin, Library);
		})(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
